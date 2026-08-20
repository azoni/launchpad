/** Shapes returned by the Variational Omni public stats endpoint, plus our derived types. */

export interface RawQuote {
  bid: string;
  ask: string;
}

export interface RawQuotes {
  updated_at: string;
  base?: RawQuote;
  size_1k?: RawQuote;
  size_100k?: RawQuote;
  size_1m?: RawQuote;
}

export interface RawListing {
  ticker: string;
  name: string;
  mark_price: string;
  volume_24h: string;
  open_interest: { long_open_interest: string; short_open_interest: string };
  funding_rate: string;
  funding_interval_s: number;
  base_spread_bps: string;
  quotes: RawQuotes;
}

export interface RawStats {
  total_volume_24h: string;
  cumulative_volume: string;
  tvl: string;
  open_interest: string;
  num_markets: number;
  listings: RawListing[];
}

/** A listing with strings coerced to numbers. */
export interface Market {
  ticker: string;
  name: string;
  mark: number;
  bid: number;
  ask: number;
  spreadBps: number;
  funding: number;
  intervalS: number;
  vol24: number;
  oiLong: number;
  oiShort: number;
  quoteTs: string;
  quotes: RawQuotes;
}

export interface Platform {
  tvl: number;
  openInterest: number;
  volume24h: number;
  cumulativeVolume: number;
  numMarkets: number;
}

export interface Snapshot {
  fetchedAt: number;
  platform: Platform;
  markets: Market[];
}

/** Rolling per-market statistics accumulated by the scheduled collector. */
export interface MarketHistory {
  n: number;
  spanS: number;
  fundingMean: number | null;
  fundingSd: number | null;
  signStability: number | null;
  /** Annualized realized volatility from log returns. */
  vol: number | null;
  /** Recent funding readings, oldest first, for sparklines. */
  fundingSeries?: number[];
  markSeries?: number[];
  /**
   * Raw sign counts, so the client can re-derive stability against the funding
   * sign that is live right now rather than the one at collection time.
   */
  posN?: number;
  negN?: number;
}

export type ExclusionReason =
  | "pinned"
  | "thin volume"
  | "thin OI"
  | "no carry"
  | "no quote"
  | "slow payback";

export interface Scored {
  ticker: string;
  name: string;
  vol24: number;
  oi: number;
  skew: number;
  funding: number;
  fundingSpot: number;
  /** Whether the carry figure came from stored history or a single snapshot. */
  basis: "mean" | "spot";
  history: MarketHistory;
  excluded: ExclusionReason | null;

  direction: "LONG" | "SHORT";
  carryApr: number;
  carryDaily: number;
  tier: string;
  costBps: number;
  entryPx: number;
  markEdgeBps: number;
  paybackDays: number;
  netApr: number;
  grossUsd: number;
  costUsd: number;
  netUsd: number;
  sizeUnits: number;
  vol: number | null;
  carryVol: number | null;
  confidence: number;
  provisional: boolean;
  flags: string[];
  score: number;
}

export interface ScoringConfig {
  notional: number;
  holdDays: number;
  minVolume: number;
  minOi: number;
  maxPayback: number;
  minObs: number;
  includePinned: boolean;
  riskAdjusted: boolean;
  conservativeTier: boolean;
}

export const DEFAULT_CONFIG: ScoringConfig = {
  notional: 100_000,
  holdDays: 7,
  minVolume: 1_000_000,
  minOi: 250_000,
  maxPayback: 3,
  minObs: 60,
  includePinned: false,
  riskAdjusted: false,
  conservativeTier: false,
};
