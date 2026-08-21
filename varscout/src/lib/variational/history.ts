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

  /**
   * Baseline for volume-spike detection. volume_24h is a rolling window, so its
   * change per second is an estimator of *current* trading rate: inflow minus
   * whatever rolled off 24h ago. Noisy per-sample, but its mean and spread over
   * days are exactly the baseline a spike needs to be measured against.
   */
  lastVol24?: number;
  lastVolTs?: number;
  vN?: number;
  vSum?: number;
  vSumSq?: number;

  /** Last total open interest, for detecting positions opening or closing. */
  lastOi?: number;
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

  // Volume flow baseline. Only positive flow is sampled: a negative delta means
  // an old burst rolled out of the trailing window, which says nothing about
  // what is trading now and would drag the baseline below zero if counted.
  if (a.lastVol24 !== undefined && a.lastVolTs !== undefined && ts > a.lastVolTs) {
    const dt = ts - a.lastVolTs;
    const rate = (m.vol24 - a.lastVol24) / dt;
    if (dt > 0 && Number.isFinite(rate) && rate >= 0) {
      a.vN = (a.vN ?? 0) + 1;
      a.vSum = (a.vSum ?? 0) + rate;
      a.vSumSq = (a.vSumSq ?? 0) + rate * rate;
    }
  }
  a.lastVol24 = m.vol24;
  a.lastVolTs = ts;
  a.lastOi = m.oiLong + m.oiShort;

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

  const vN = a.vN ?? 0;
  return {
    n: a.n,
    spanS: Math.max(0, a.lastTs - a.firstTs),
    fundingMean: a.fSum / a.n,
    fundingSd: sd(a.n, a.fSum, a.fSumSq),
    signStability,
    vol: rsd === null ? null : rsd * Math.sqrt(SECONDS_PER_YEAR),
    fundingSeries: a.fSeries,
    markSeries: a.mSeries,
    volRateMean: vN >= MIN_VOL_SAMPLES ? (a.vSum ?? 0) / vN : null,
    volRateSd: vN >= MIN_VOL_SAMPLES ? sd(vN, a.vSum ?? 0, a.vSumSq ?? 0) : null,
    volRateN: vN,
  };
}
