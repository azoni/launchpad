import type { Market, RawStats, Snapshot } from "./types";

export const OMNI_STATS_URL =
  "https://omni-client-api.prod.ap-northeast-1.variational.io/metadata/stats";

const num = (v: string | number | undefined | null): number => {
  const n = typeof v === "number" ? v : parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};

/**
 * Fetch and normalize the public stats endpoint.
 *
 * The endpoint returns 403 without a User-Agent. Browsers always send one, so
 * the header only matters for server-side calls (the scheduled collector).
 * CORS is `*`, which is why the client can call this directly.
 */
export async function fetchSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  const res = await fetch(OMNI_STATS_URL, {
    signal,
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Variational API returned ${res.status}`);
  return normalize((await res.json()) as RawStats);
}

/**
 * Server-side fetch with ISR caching, for pages that need real content in the
 * HTML for crawlers. The endpoint 403s without a User-Agent, which matters here
 * because — unlike the browser — the server sends none by default.
 */
export async function fetchSnapshotCached(revalidate = 300): Promise<Snapshot> {
  const res = await fetch(OMNI_STATS_URL, {
    headers: { Accept: "application/json", "User-Agent": "varscout/1.0 (+https://varscout.netlify.app)" },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Variational API returned ${res.status}`);
  return normalize((await res.json()) as RawStats);
}

export function normalize(raw: RawStats): Snapshot {
  const markets: Market[] = [];
  for (const l of raw.listings ?? []) {
    const base = l.quotes?.base;
    const bid = num(base?.bid);
    const ask = num(base?.ask);
    if (bid <= 0 || ask <= 0) continue;
    markets.push({
      ticker: l.ticker,
      name: l.name ?? l.ticker,
      mark: num(l.mark_price),
      bid,
      ask,
      spreadBps: num(l.base_spread_bps),
      funding: num(l.funding_rate),
      intervalS: l.funding_interval_s ?? 0,
      vol24: num(l.volume_24h),
      oiLong: num(l.open_interest?.long_open_interest),
      oiShort: num(l.open_interest?.short_open_interest),
      quoteTs: l.quotes?.updated_at ?? "",
      quotes: l.quotes,
    });
  }
  return {
    fetchedAt: Date.now(),
    platform: {
      tvl: num(raw.tvl),
      openInterest: num(raw.open_interest),
      volume24h: num(raw.total_volume_24h),
      cumulativeVolume: num(raw.cumulative_volume),
      numMarkets: raw.num_markets ?? markets.length,
    },
    markets,
  };
}
