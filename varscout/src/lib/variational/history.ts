import type { Market, MarketHistory } from "./types";

export const SECONDS_PER_YEAR = 365 * 24 * 3600;

/** Trailing points kept per market for sparklines. At 5-minute polling, 288 ≈ 24h. */
export const SERIES_CAP = 288;

/** Minimum return samples before realized volatility is meaningful. */
export const MIN_VOL_SAMPLES = 20;

/**
 * Running per-market statistics.
 *
 * Kept as incremental sums rather than recomputed from raw snapshots so the
 * collector touches exactly one document per run regardless of how much history
 * has accumulated. Everything in MarketHistory is derivable from these.
 */
export interface Accum {
  n: number;
  firstTs: number;
  lastTs: number;
  /** Funding: running sum and sum of squares, plus sign counts. */
  fSum: number;
  fSumSq: number;
  posN: number;
  negN: number;
  /** Last observed mark, for the next log return. */
  lastMark: number;
  lastMarkTs: number;
  /** dt-scaled log returns: count, sum, sum of squares. */
  rN: number;
  rSum: number;
  rSumSq: number;
  /** Trailing series for sparklines, oldest first. */
  fSeries: number[];
  mSeries: number[];
}

export const emptyAccum = (): Accum => ({
  n: 0,
  firstTs: 0,
  lastTs: 0,
  fSum: 0,
  fSumSq: 0,
  posN: 0,
  negN: 0,
  lastMark: 0,
  lastMarkTs: 0,
  rN: 0,
  rSum: 0,
  rSumSq: 0,
  fSeries: [],
  mSeries: [],
});

/**
 * Fold one observation into a market's accumulator. `ts` is in seconds.
 *
 * Returns are scaled by their own sqrt(dt) so an irregular polling cadence — a
 * missed run, a cold start, a retry — does not distort annualized volatility.
 */
export function accumulate(prev: Accum | undefined, m: Market, ts: number): Accum {
  const a: Accum = prev ? { ...prev, fSeries: [...prev.fSeries], mSeries: [...prev.mSeries] } : emptyAccum();

  a.n += 1;
  if (!a.firstTs) a.firstTs = ts;
  a.lastTs = ts;

  a.fSum += m.funding;
  a.fSumSq += m.funding * m.funding;
  if (m.funding > 0) a.posN += 1;
  else if (m.funding < 0) a.negN += 1;

  if (a.lastMark > 0 && m.mark > 0 && ts > a.lastMarkTs) {
    const dt = ts - a.lastMarkTs;
    if (dt > 0) {
      const r = Math.log(m.mark / a.lastMark) / Math.sqrt(dt);
      if (Number.isFinite(r)) {
        a.rN += 1;
        a.rSum += r;
        a.rSumSq += r * r;
      }
    }
  }
  if (m.mark > 0) {
    a.lastMark = m.mark;
    a.lastMarkTs = ts;
  }

  a.fSeries.push(m.funding);
  a.mSeries.push(m.mark);
  if (a.fSeries.length > SERIES_CAP) a.fSeries = a.fSeries.slice(-SERIES_CAP);
  if (a.mSeries.length > SERIES_CAP) a.mSeries = a.mSeries.slice(-SERIES_CAP);

  return a;
}

const sd = (n: number, sum: number, sumSq: number): number | null => {
  if (n < 2) return null;
  const mean = sum / n;
  const v = sumSq / n - mean * mean;
  return v > 0 ? Math.sqrt(v) : 0;
};

/**
 * Derive the display/scoring view from an accumulator.
 *
 * `currentFunding` decides which sign stability is measured against — the
 * question is how often funding has held the sign it has *right now*, since a
 * rate that keeps flipping cannot be harvested however large it looks today.
 */
export function derive(a: Accum | undefined, currentFunding: number): MarketHistory {
  if (!a || a.n === 0) {
    return { n: 0, spanS: 0, fundingMean: null, fundingSd: null, signStability: null, vol: null };
  }
  const signStability =
    currentFunding === 0 ? null : (currentFunding > 0 ? a.posN : a.negN) / a.n;

  const rsd = a.rN >= MIN_VOL_SAMPLES ? sd(a.rN, a.rSum, a.rSumSq) : null;

  return {
    n: a.n,
    spanS: Math.max(0, a.lastTs - a.firstTs),
    fundingMean: a.fSum / a.n,
    fundingSd: sd(a.n, a.fSum, a.fSumSq),
    signStability,
    vol: rsd === null ? null : rsd * Math.sqrt(SECONDS_PER_YEAR),
    fundingSeries: a.fSeries,
    markSeries: a.mSeries,
  };
}
