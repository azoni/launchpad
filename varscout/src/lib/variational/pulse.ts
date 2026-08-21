import { costAt } from "./scoring";
import { SECONDS_PER_YEAR } from "./history";
import type { Market, MarketHistory } from "./types";

/** One observed upstream tick for a market, keyed by the venue's own timestamp. */
export interface Tick {
  ts: number; // seconds, from quotes.updated_at
  mark: number;
  vol24: number;
  oi: number;
  funding: number;
}

export interface PulseConfig {
  notional: number;
  /** Intended holding period, in hours. Quick trades live here, not in days. */
  holdHours: number;
  /** Reject markets whose typical move can't clear the spread by this multiple. */
  minViability: number;
  minVolume: number;
}

export const DEFAULT_PULSE: PulseConfig = {
  notional: 25_000,
  holdHours: 4,
  minViability: 1.5,
  minVolume: 1_000_000,
};

export type FlowRead =
  | "new longs"
  | "new shorts"
  | "shorts covering"
  | "longs closing"
  | "quiet";

export interface Pulsed {
  ticker: string;
  name: string;
  vol24: number;
  mark: number;

  /** Window actually measured, in seconds — real elapsed upstream time. */
  windowS: number;
  samples: number;

  /** Fresh volume in USD/hour over the window. */
  volRate: number | null;
  /** Baseline USD/hour from collected history. */
  volBaseline: number | null;
  /** How many standard deviations above baseline the current rate is. */
  volZ: number | null;
  /** Plain multiple of baseline, which reads better than a z-score. */
  volMult: number | null;

  /** Price change across the window. */
  movePct: number | null;
  /** That move expressed in standard deviations for the window length. */
  moveSigma: number | null;

  oiDeltaPct: number | null;
  flow: FlowRead;

  /** Annualized vol used for the viability test, and where it came from. */
  vol: number | null;
  volSource: "session" | "collected" | null;

  costBps: number;
  tier: string;
  /** Round-trip spread expressed as the % move needed just to break even. */
  breakevenPct: number;
  /** One-sigma move over the holding window. */
  typicalMovePct: number | null;
  /** typicalMove / breakeven. Below 1 means the spread eats a typical move. */
  viability: number | null;

  /** Carry over the hold — usually negligible at these horizons, shown for honesty. */
  carryOverHoldPct: number;

  bias: "LONG" | "SHORT" | null;
  activity: number;
  score: number;
  flags: string[];
  excluded: string | null;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Realized annualized vol from a session tick window, dt-scaled like the collector's. */
export function sessionVol(ticks: Tick[]): number | null {
  if (ticks.length < 6) return null;
  const scaled: number[] = [];
  for (let i = 1; i < ticks.length; i++) {
    const dt = ticks[i].ts - ticks[i - 1].ts;
    const a = ticks[i - 1].mark;
    const b = ticks[i].mark;
    if (dt <= 0 || a <= 0 || b <= 0) continue;
    const r = Math.log(b / a) / Math.sqrt(dt);
    if (Number.isFinite(r)) scaled.push(r);
  }
  if (scaled.length < 5) return null;
  const mu = scaled.reduce((s, x) => s + x, 0) / scaled.length;
  const v = scaled.reduce((s, x) => s + (x - mu) ** 2, 0) / scaled.length;
  return Math.sqrt(v) * Math.sqrt(SECONDS_PER_YEAR);
}

function readFlow(movePct: number | null, oiDeltaPct: number | null): FlowRead {
  if (movePct === null || oiDeltaPct === null) return "quiet";
  const up = movePct > 0;
  const opening = oiDeltaPct > 0.002; // 0.2% of OI
  const closing = oiDeltaPct < -0.002;
  if (opening) return up ? "new longs" : "new shorts";
  if (closing) return up ? "shorts covering" : "longs closing";
  return "quiet";
}

/**
 * Score one market for a short-horizon trade.
 *
 * The ranking is about where activity is, not where profit is: a volume spike
 * says something is happening, it does not say which way it goes. The viability
 * gate is what keeps that honest — on a horizon of hours, funding carry is
 * nearly worthless and the spread is the binding constraint, so a market only
 * qualifies if it typically moves enough to clear its own round trip.
 */
export function pulse(
  m: Market,
  ticks: Tick[],
  hist: MarketHistory | undefined,
  cfg: PulseConfig,
): Pulsed {
  const flags: string[] = [];
  const base: Pulsed = {
    ticker: m.ticker,
    name: m.name,
    vol24: m.vol24,
    mark: m.mark,
    windowS: 0,
    samples: ticks.length,
    volRate: null,
    volBaseline: null,
    volZ: null,
    volMult: null,
    movePct: null,
    moveSigma: null,
    oiDeltaPct: null,
    flow: "quiet",
    vol: null,
    volSource: null,
    costBps: 0,
    tier: "",
    breakevenPct: 0,
    typicalMovePct: null,
    viability: null,
    carryOverHoldPct: 0,
    bias: null,
    activity: 0,
    score: 0,
    flags,
    excluded: null,
  };

  if (m.vol24 < cfg.minVolume) return { ...base, excluded: "thin volume" };

  const cost = costAt(m.quotes, cfg.notional);
  if (!cost || !(cost.mid > 0)) return { ...base, excluded: "no quote" };
  if (!cost.covered) flags.push("size>quote");

  const breakevenPct = cost.costBps / 1e4;

  // --- window measurements from the session tick buffer ---
  const first = ticks[0];
  const last = ticks[ticks.length - 1];
  const windowS = ticks.length >= 2 ? last.ts - first.ts : 0;

  let volRate: number | null = null;
  let movePct: number | null = null;
  let oiDeltaPct: number | null = null;

  if (windowS > 0) {
    const dv = last.vol24 - first.vol24;
    // Negative means an old burst rolled off the trailing 24h window rather than
    // trading having stopped, so it is floored rather than treated as signal.
    volRate = Math.max(0, dv) / (windowS / 3600);
    movePct = first.mark > 0 ? (last.mark - first.mark) / first.mark : null;
    oiDeltaPct = first.oi > 0 ? (last.oi - first.oi) / first.oi : null;
  }

  // --- volatility ---
  // The collected baseline is preferred even though it is coarser. Vol measured
  // from a short window is badly unstable: a price that trends smoothly has
  // almost no variance in its increments, so session vol collapses toward zero
  // and would report a market as untradeable precisely when it is moving most.
  // The multi-day figure also makes "2 sigma" mean "large for this market"
  // rather than "large compared to the last ten minutes".
  const sv = sessionVol(ticks);
  const vol = hist?.vol ?? sv ?? null;
  const volSource = hist?.vol != null ? "collected" : sv !== null ? "session" : null;

  const holdYears = cfg.holdHours / (365 * 24);
  const typicalMovePct = vol !== null ? vol * Math.sqrt(holdYears) : null;
  const viability = typicalMovePct !== null && breakevenPct > 0 ? typicalMovePct / breakevenPct : null;

  // --- volume spike against the collector's baseline ---
  const baselineHr = hist?.volRateMean != null ? hist.volRateMean * 3600 : null;
  const baselineSdHr = hist?.volRateSd != null ? hist.volRateSd * 3600 : null;
  const volZ =
    volRate !== null && baselineHr !== null && baselineSdHr && baselineSdHr > 0
      ? (volRate - baselineHr) / baselineSdHr
      : null;
  const volMult = volRate !== null && baselineHr && baselineHr > 0 ? volRate / baselineHr : null;

  const moveSigma =
    movePct !== null && vol !== null && windowS > 0
      ? movePct / (vol * Math.sqrt(windowS / SECONDS_PER_YEAR))
      : null;

  const carryOverHoldPct = (Math.abs(m.funding) * cfg.holdHours) / (365 * 24);

  // --- gates ---
  // A zero-length window means every tick carried the same upstream timestamp,
  // so nothing has actually been observed yet however many polls were made.
  if (ticks.length < 2 || windowS <= 0)
    return { ...base, costBps: cost.costBps, tier: cost.tier, breakevenPct, excluded: "warming up" };
  if (viability === null) return { ...base, costBps: cost.costBps, tier: cost.tier, breakevenPct, excluded: "no volatility yet" };
  if (viability < cfg.minViability)
    return {
      ...base,
      costBps: cost.costBps,
      tier: cost.tier,
      breakevenPct,
      typicalMovePct,
      viability,
      vol,
      volSource,
      excluded: "spread too wide for the hold",
    };

  // --- activity blend ---
  // Each component is clamped so one extreme reading cannot dominate the rank.
  const spikeTerm = volZ !== null ? clamp(volZ / 3, 0, 1) : volMult !== null ? clamp((volMult - 1) / 2, 0, 1) : 0;
  const moveTerm = moveSigma !== null ? clamp(Math.abs(moveSigma) / 2.5, 0, 1) : 0;
  const oiTerm = oiDeltaPct !== null ? clamp(Math.abs(oiDeltaPct) / 0.05, 0, 1) : 0;
  const activity = spikeTerm * 0.45 + moveTerm * 0.35 + oiTerm * 0.2;

  const flow = readFlow(movePct, oiDeltaPct);
  // Continuation, not reversal: the readable signal here is that flow is
  // entering on one side, not that it is exhausted.
  const bias =
    movePct === null || Math.abs(moveSigma ?? 0) < 0.5 ? null : movePct > 0 ? "LONG" : "SHORT";

  if (volMult !== null && volMult >= 3) flags.push("volume spike");
  if (moveSigma !== null && Math.abs(moveSigma) >= 2) flags.push("outsized move");
  if (oiDeltaPct !== null && oiDeltaPct >= 0.03) flags.push("OI building");
  if (oiDeltaPct !== null && oiDeltaPct <= -0.03) flags.push("OI unwinding");
  if (viability < 2.5) flags.push("tight vs spread");
  if (m.vol24 < 2_000_000) flags.push("thin");
  if (hist?.volRateN != null && hist.volRateN < 20) flags.push("baseline provisional");

  return {
    ...base,
    windowS,
    volRate,
    volBaseline: baselineHr,
    volZ,
    volMult,
    movePct,
    moveSigma,
    oiDeltaPct,
    flow,
    vol,
    volSource,
    costBps: cost.costBps,
    tier: cost.tier,
    breakevenPct,
    typicalMovePct,
    viability,
    carryOverHoldPct,
    bias,
    activity,
    score: activity,
    flags,
  };
}

export function rankPulse(
  markets: Market[],
  buffers: Record<string, Tick[]>,
  histories: Record<string, MarketHistory>,
  cfg: PulseConfig,
): { scored: Pulsed[]; excluded: Record<string, number> } {
  const scored: Pulsed[] = [];
  const excluded: Record<string, number> = {};
  for (const m of markets) {
    const r = pulse(m, buffers[m.ticker] ?? [], histories[m.ticker], cfg);
    if (r.excluded) excluded[r.excluded] = (excluded[r.excluded] ?? 0) + 1;
    else scored.push(r);
  }
  scored.sort((a, b) => b.score - a.score);
  return { scored, excluded };
}
