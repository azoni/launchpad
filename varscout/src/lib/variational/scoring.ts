import type {
  ExclusionReason,
  Market,
  MarketHistory,
  RawQuotes,
  Scored,
  ScoringConfig,
} from "./types";

/**
 * Published quote tiers and the notional each one prices. Only the deepest
 * markets publish size_1m, so the depth curve is built from whatever exists.
 * `base` is the minimum-size quote; $100 is a nominal stand-in on the curve.
 */
export const TIERS: [keyof RawQuotes, number][] = [
  ["base", 100],
  ["size_1k", 1_000],
  ["size_100k", 100_000],
  ["size_1m", 1_000_000],
];

/**
 * Roughly 79% of the book sits at a default funding rate carrying no signal:
 * 0.1095 is exactly 0.01%/8h annualized, and a further slice sits at zero.
 */
export const PINNED = [0.1095, 0];

/** Lower bound on the confidence multiplier so a cold start still ranks sensibly. */
export const MIN_CONFIDENCE = 0.05;

export const EMPTY_HISTORY: MarketHistory = {
  n: 0,
  spanS: 0,
  fundingMean: null,
  fundingSd: null,
  signStability: null,
  vol: null,
};

export const isPinned = (funding: number) =>
  PINNED.some((p) => Math.abs(funding - p) < 1e-9);

interface CurvePoint {
  size: number;
  bps: number;
  mid: number;
  name: string;
}

/** The published depth curve, ascending by notional. */
export function tierCurve(quotes: RawQuotes): CurvePoint[] {
  const pts: CurvePoint[] = [];
  for (const [name, size] of TIERS) {
    const q = quotes?.[name] as { bid: string; ask: string } | undefined;
    if (!q) continue;
    const bid = parseFloat(q.bid);
    const ask = parseFloat(q.ask);
    if (!(bid > 0) || !(ask > 0)) continue;
    const mid = (ask + bid) / 2;
    pts.push({ size, bps: ((ask - bid) / mid) * 1e4, mid, name: name as string });
  }
  return pts.sort((a, b) => a.size - b.size);
}

export interface CostQuote {
  costBps: number;
  mid: number;
  tier: string;
  covered: boolean;
}

/**
 * Estimated round-trip cost in bps for a given notional.
 *
 * Tiers are sparse ($100 / $1k / $100k / $1m) and the spread widens brutally
 * with size in thin markets — XMR goes 5.7bp to 49.9bp between base and $100k.
 * A clip landing between two tiers is priced by log-size interpolation rather
 * than being charged the full cost of the next tier up. `conservative` restores
 * the pessimistic bracket behaviour.
 */
export function costAt(
  quotes: RawQuotes,
  notional: number,
  conservative = false,
): CostQuote | null {
  const pts = tierCurve(quotes);
  if (!pts.length) return null;
  const refMid = pts[0].mid;

  if (conservative) {
    const hit = pts.find((p) => notional <= p.size);
    if (hit) return { costBps: hit.bps, mid: hit.mid, tier: hit.name, covered: true };
    const last = pts[pts.length - 1];
    return { costBps: last.bps, mid: last.mid, tier: last.name, covered: false };
  }

  const first = pts[0];
  const last = pts[pts.length - 1];
  if (notional <= first.size)
    return { costBps: first.bps, mid: refMid, tier: first.name, covered: true };
  if (notional >= last.size)
    // Past the deepest published quote the true cost is unknown and worse than
    // this. Flag it rather than pretend the curve stops here.
    return { costBps: last.bps, mid: refMid, tier: last.name, covered: notional <= last.size };

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (notional >= a.size && notional <= b.size) {
      const f =
        (Math.log10(notional) - Math.log10(a.size)) / (Math.log10(b.size) - Math.log10(a.size));
      return {
        costBps: a.bps + f * (b.bps - a.bps),
        mid: refMid,
        tier: `${a.name}~${b.name}`,
        covered: true,
      };
    }
  }
  return { costBps: last.bps, mid: refMid, tier: last.name, covered: false };
}

const reject = (base: Partial<Scored>, reason: ExclusionReason): Scored =>
  ({ ...base, excluded: reason }) as Scored;

/** Score one market. Returns a Scored with `excluded` set if it failed a gate. */
export function evaluate(m: Market, hist: MarketHistory, cfg: ScoringConfig): Scored {
  const oi = m.oiLong + m.oiShort;
  const skew = oi > 0 ? (m.oiLong - m.oiShort) / oi : 0;

  // Prefer the historical mean over the spot rate: one snapshot of a funding
  // rate is a single draw, and it is the average that actually pays.
  const useMean = hist.n >= cfg.minObs && hist.fundingMean !== null;
  const funding = useMean ? (hist.fundingMean as number) : m.funding;

  const base: Partial<Scored> = {
    ticker: m.ticker,
    name: m.name,
    vol24: m.vol24,
    oi,
    skew,
    funding,
    fundingSpot: m.funding,
    basis: useMean ? "mean" : "spot",
    history: hist,
    flags: [],
    excluded: null,
  };

  if (!cfg.includePinned && isPinned(m.funding)) return reject(base, "pinned");
  if (m.vol24 < cfg.minVolume) return reject(base, "thin volume");
  if (oi < cfg.minOi) return reject(base, "thin OI");
  if (funding === 0) return reject(base, "no carry");

  // Positive funding: longs pay shorts, so shorting collects. Negative: reverse.
  const direction: "LONG" | "SHORT" = funding > 0 ? "SHORT" : "LONG";
  const carryApr = Math.abs(funding);

  const cost = costAt(m.quotes, cfg.notional, cfg.conservativeTier);
  if (!cost || !(cost.mid > 0)) return reject(base, "no quote");

  const flags: string[] = [];
  if (!cost.covered) flags.push("size>quote");

  // Entry sits half the round trip away from mid, on the side you cross.
  const half = cost.costBps / 2 / 1e4;
  const tbid = cost.mid * (1 - half);
  const task = cost.mid * (1 + half);
  const entryPx = direction === "SHORT" ? tbid : task;

  // Immediate mark-to-market on entry: you trade at bid/ask, but PnL and
  // liquidation price run off the mark, so the gap is real money.
  const markEdgeBps =
    m.mark > 0 ? ((direction === "SHORT" ? tbid - m.mark : m.mark - task) / m.mark) * 1e4 : 0;

  const carryDaily = carryApr / 365;
  const paybackDays = carryDaily > 0 ? cost.costBps / 1e4 / carryDaily : Infinity;
  if (paybackDays > cfg.maxPayback) return reject({ ...base, flags }, "slow payback");

  // Amortize the one-off round-trip cost across the intended holding period.
  const netApr = carryApr - ((cost.costBps / 1e4) / cfg.holdDays) * 365;
  const grossUsd = (carryApr * cfg.notional * cfg.holdDays) / 365;
  const costUsd = (cost.costBps / 1e4) * cfg.notional;

  const vol = hist.vol;
  const carryVol = vol && vol > 0 ? netApr / vol : null;

  const coverage = cfg.minObs > 0 ? Math.min(1, hist.n / cfg.minObs) : 1;
  const stability = hist.signStability ?? 0.5;
  // Floor the multiplier: with no history at all, coverage is 0, and an
  // unfloored confidence would collapse every score to 0 and leave the ranking
  // in arbitrary input order. The floor lets a cold start degrade gracefully to
  // ranking by net APR while still letting confirmed markets outrank provisional ones.
  const confidence = Math.max(MIN_CONFIDENCE, coverage * stability);
  const provisional = hist.n < cfg.minObs;

  if (provisional) flags.push("provisional");
  if (hist.signStability !== null && hist.signStability < 0.8) flags.push("funding flips");
  if (cost.costBps > 25) flags.push("wide spread");
  if (m.vol24 < 2_000_000) flags.push("thin");
  // Joining the crowd: OI already piled onto the side carry is pushing you to.
  if (direction === "SHORT" && skew < -0.7) flags.push("crowded short");
  if (direction === "LONG" && skew > 0.7) flags.push("crowded long");
  if (vol && vol > 1.5) flags.push("high vol");

  const score = cfg.riskAdjusted && carryVol !== null ? carryVol * confidence : netApr * confidence;

  return {
    ...(base as Scored),
    direction,
    carryApr,
    carryDaily,
    tier: cost.tier,
    costBps: cost.costBps,
    entryPx,
    markEdgeBps,
    paybackDays,
    netApr,
    grossUsd,
    costUsd,
    netUsd: grossUsd - costUsd,
    sizeUnits: entryPx > 0 ? cfg.notional / entryPx : 0,
    vol,
    carryVol,
    confidence,
    provisional,
    flags,
    score,
  };
}

export interface RankResult {
  scored: Scored[];
  excluded: Record<string, number>;
}

export function rank(
  markets: Market[],
  histories: Record<string, MarketHistory>,
  cfg: ScoringConfig,
): RankResult {
  const scored: Scored[] = [];
  const excluded: Record<string, number> = {};
  for (const m of markets) {
    const r = evaluate(m, histories[m.ticker] ?? EMPTY_HISTORY, cfg);
    if (r.excluded) excluded[r.excluded] = (excluded[r.excluded] ?? 0) + 1;
    else scored.push(r);
  }
  scored.sort((a, b) => b.score - a.score);
  return { scored, excluded };
}
