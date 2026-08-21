import { costAt } from "./scoring";
import { SECONDS_PER_YEAR } from "./history";
import type { Reference } from "@/lib/reference/binance";
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
  /**
   * Floor on *real* market activity, from reference data where available.
   * Deliberately not a floor on Omni's own venue volume: that runs 8-100x below
   * a token's actual turnover and was hiding genuine movers.
   */
  minRefVolume: number;
  /** Last-resort floor on Omni volume, used only where no reference exists. */
  minOmniVolume: number;
}

export const DEFAULT_PULSE: PulseConfig = {
  notional: 25_000,
  holdHours: 4,
  minViability: 1.5,
  minRefVolume: 2_000_000,
  minOmniVolume: 50_000,
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
  /** Omni's own venue volume — what you can trade here. */
  vol24: number;
  /** Global 24h volume from reference data, where covered. */
  refVol24: number | null;
  /** Global 24h price change, available immediately with no warm-up. */
  refPct24: number | null;
  /** Latest real 5m volume bar vs the median of prior bars. */
  refSpike: number | null;
  refSymbol: string | null;
  /** Where the activity figures came from. */
  activitySource: "reference" | "omni";
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
  volSource: "session" | "collected" | "implied" | null;
  /** Whether the spike figure was measured from real bars or inferred. */
  spikeSource: "measured" | "inferred" | null;

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
  ref?: Reference,
): Pulsed {
  const flags: string[] = [];
  const base: Pulsed = {
    ticker: m.ticker,
    name: m.name,
    vol24: m.vol24,
    refVol24: ref?.vol24 ?? null,
    refPct24: ref?.pct24 ?? null,
    refSpike: ref?.spike ?? null,
    refSymbol: ref?.symbol ?? null,
    activitySource: ref ? "reference" : "omni",
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
    spikeSource: null,
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

  // Activity gate. Where reference coverage exists it decides, because it
  // measures the token's real turnover. Omni's own volume is only consulted as
  // a fallback, and then only to weed out genuinely dead listings — a market
  // being quiet *on Omni* says nothing about whether the token is in play.
  if (ref) {
    if (ref.vol24 < cfg.minRefVolume) return { ...base, excluded: "quiet globally" };
  } else if (m.vol24 < cfg.minOmniVolume) {
    return { ...base, excluded: "thin volume" };
  }

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
  //
  // Last resort, for markets the collector does not track: imply vol from the
  // reference 24h move. For a random walk E|r| = sigma*sqrt(2/pi), so a single
  // day's absolute return divided by 0.798 estimates a daily sigma. It is one
  // noisy sample rather than a real estimate, and is labelled as such — but it
  // beats excluding an obviously active market for want of a number.
  const sv = sessionVol(ticks);
  const impliedVol =
    ref && Number.isFinite(ref.pct24) ? (Math.abs(ref.pct24) / 0.7979) * Math.sqrt(365) : null;
  const vol = hist?.vol ?? sv ?? impliedVol ?? null;
  const volSource: Pulsed["volSource"] =
    hist?.vol != null ? "collected" : sv !== null ? "session" : impliedVol !== null ? "implied" : null;

  const holdYears = cfg.holdHours / (365 * 24);
  const typicalMovePct = vol !== null ? vol * Math.sqrt(holdYears) : null;
  const viability = typicalMovePct !== null && breakevenPct > 0 ? typicalMovePct / breakevenPct : null;

  // --- volume spike ---
  // A real 5-minute bar from reference data beats anything inferred from a
  // rolling 24h figure: it is measured rather than estimated, and it needs no
  // baseline to warm up. The inferred version stays as the fallback for markets
  // with no reference coverage.
  const baselineHr = hist?.volRateMean != null ? hist.volRateMean * 3600 : null;
  const baselineSdHr = hist?.volRateSd != null ? hist.volRateSd * 3600 : null;
  const volZ =
    volRate !== null && baselineHr !== null && baselineSdHr && baselineSdHr > 0
      ? (volRate - baselineHr) / baselineSdHr
      : null;
  const inferredMult = volRate !== null && baselineHr && baselineHr > 0 ? volRate / baselineHr : null;
  const volMult = ref?.spike ?? inferredMult;
  const spikeSource: Pulsed["spikeSource"] =
    ref?.spike != null ? "measured" : inferredMult !== null ? "inferred" : null;

  const moveSigma =
    movePct !== null && vol !== null && windowS > 0
      ? movePct / (vol * Math.sqrt(windowS / SECONDS_PER_YEAR))
      : null;

  const carryOverHoldPct = (Math.abs(m.funding) * cfg.holdHours) / (365 * 24);

  // --- gates ---
  // A cold tick buffer is no longer fatal: reference data carries a 24h move and
  // a measured spike, which is enough to rank a market on its first paint. Only
  // exclude when there is neither a window nor any reference to fall back on.
  const hasWindow = ticks.length >= 2 && windowS > 0;
  if (!hasWindow && !ref)
    return { ...base, costBps: cost.costBps, tier: cost.tier, breakevenPct, excluded: "warming up" };
  if (viability === null)
    return { ...base, costBps: cost.costBps, tier: cost.tier, breakevenPct, excluded: "no volatility yet" };
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
  // A measured spike is trusted directly; the inferred z-score is only used when
  // no real bars are available.
  const spikeTerm =
    volMult !== null
      ? clamp((volMult - 1) / 2, 0, 1)
      : volZ !== null
        ? clamp(volZ / 3, 0, 1)
        : 0;
  // Short-window movement is the sharper signal, but a cold buffer falls back to
  // the reference 24h move so a market still ranks on its first paint.
  const windowMoveTerm = moveSigma !== null ? clamp(Math.abs(moveSigma) / 2.5, 0, 1) : 0;
  const dayMoveTerm = ref ? clamp(Math.abs(ref.pct24) / 0.15, 0, 1) : 0;
  const moveTerm = hasWindow ? Math.max(windowMoveTerm, dayMoveTerm * 0.6) : dayMoveTerm;
  const oiTerm = oiDeltaPct !== null ? clamp(Math.abs(oiDeltaPct) / 0.05, 0, 1) : 0;
  const activity = spikeTerm * 0.4 + moveTerm * 0.4 + oiTerm * 0.2;

  const flow = readFlow(movePct, oiDeltaPct);
  // Continuation, not reversal: the readable signal here is that flow is
  // entering on one side, not that it is exhausted. Falls back to the reference
  // day move while the tick buffer is still cold.
  const directional = hasWindow && Math.abs(moveSigma ?? 0) >= 0.5 ? movePct : null;
  const dayDirectional = ref && Math.abs(ref.pct24) >= 0.02 ? ref.pct24 : null;
  const biasSource = directional ?? dayDirectional;
  const bias = biasSource === null ? null : biasSource > 0 ? "LONG" : "SHORT";

  if (volMult !== null && volMult >= 2.5) flags.push("volume spike");
  if (moveSigma !== null && Math.abs(moveSigma) >= 2) flags.push("outsized move");
  if (ref && Math.abs(ref.pct24) >= 0.1) flags.push("big 24h move");
  if (oiDeltaPct !== null && oiDeltaPct >= 0.03) flags.push("OI building");
  if (oiDeltaPct !== null && oiDeltaPct <= -0.03) flags.push("OI unwinding");
  if (viability < 2.5) flags.push("tight vs spread");
  // Thinness now means thin *on Omni* specifically — the venue you have to fill
  // on — which is a distinct warning from the token being quiet overall.
  if (m.vol24 < 500_000) flags.push("thin on Omni");
  if (!ref) flags.push("no reference data");
  if (volSource === "implied") flags.push("vol implied from 24h move");

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
    spikeSource,
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
  references: Record<string, Reference> = {},
): { scored: Pulsed[]; excluded: Record<string, number> } {
  const scored: Pulsed[] = [];
  const excluded: Record<string, number> = {};
  for (const m of markets) {
    const r = pulse(m, buffers[m.ticker] ?? [], histories[m.ticker], cfg, references[m.ticker]);
    if (r.excluded) excluded[r.excluded] = (excluded[r.excluded] ?? 0) + 1;
    else scored.push(r);
  }
  scored.sort((a, b) => b.score - a.score);
  return { scored, excluded };
}
