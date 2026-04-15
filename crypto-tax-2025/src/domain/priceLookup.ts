// Client-side price lookup. Calls CoinGecko directly from the browser
// to avoid Netlify's 10-second function timeout. Deduplicates by
// asset+date so the same price isn't fetched twice.

import type { NormalizedTransaction } from "../types";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  WETH: "weth",
  WBTC: "wrapped-bitcoin",
  SOL: "solana",
  USDC: "usd-coin",
  USDT: "tether",
  DOGE: "dogecoin",
  XRP: "ripple",
  ADA: "cardano",
  BONK: "bonk",
  JUP: "jupiter-exchange-solana",
  WIF: "dogwifcoin",
  POPCAT: "popcat",
  RENDER: "render-token",
  PEPE: "pepe",
  WLUNA: "wrapped-terra",
  TAO: "bittensor",
  TRAC: "origintrail",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  "mSOL": "msol",
};

const STABLES = new Set(["USDC", "USDT", "DAI", "BUSD", "TUSD", "FRAX", "PYUSD", "USD"]);

function formatCgDate(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPrice(coinId: string, dateStr: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${dateStr}&localization=false`;
    const res = await fetch(url);
    if (res.status === 429) {
      await sleep(10000);
      const retry = await fetch(url);
      if (!retry.ok) return null;
      const data = (await retry.json()) as { market_data?: { current_price?: { usd?: number } } };
      return data.market_data?.current_price?.usd ?? null;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as { market_data?: { current_price?: { usd?: number } } };
    return data.market_data?.current_price?.usd ?? null;
  } catch {
    return null;
  }
}

export type PriceProgress = {
  total: number;
  completed: number;
  found: number;
  current: string;
};

export async function fillMissingPrices(
  txs: NormalizedTransaction[],
  onProgress?: (p: PriceProgress) => void
): Promise<NormalizedTransaction[]> {
  const needsPrice = txs.filter(
    (t) =>
      t.usdValue === null &&
      (t.assetReceived || t.assetSent) &&
      (t.amountReceived || t.amountSent)
  );
  if (needsPrice.length === 0) return txs;

  // Deduplicate by asset+date
  const lookups: Array<{ asset: string; coinId: string; date: string; key: string }> = [];
  const seen = new Set<string>();

  for (const t of needsPrice) {
    const asset = (t.assetReceived ?? t.assetSent ?? "").toUpperCase();
    if (!asset || STABLES.has(asset)) continue;
    const day = new Date(t.timestamp).toISOString().slice(0, 10);
    const key = `${asset}:${day}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const coinId = COINGECKO_IDS[asset];
    if (!coinId) continue;
    lookups.push({ asset, coinId, date: formatCgDate(t.timestamp), key });
  }

  // Add stablecoin entries directly
  const priceMap = new Map<string, number>();
  for (const t of needsPrice) {
    const asset = (t.assetReceived ?? t.assetSent ?? "").toUpperCase();
    if (STABLES.has(asset)) {
      const day = new Date(t.timestamp).toISOString().slice(0, 10);
      priceMap.set(`${asset}:${day}`, 1.0);
    }
  }

  if (lookups.length === 0 && priceMap.size === 0) return txs;

  // Fetch prices one at a time with rate limiting
  let found = priceMap.size;
  for (let i = 0; i < lookups.length; i++) {
    const l = lookups[i];
    onProgress?.({
      total: lookups.length,
      completed: i,
      found,
      current: `${l.asset} on ${l.date}`,
    });

    const price = await fetchPrice(l.coinId, l.date);
    if (price !== null) {
      priceMap.set(l.key, price);
      found++;
    }

    // CoinGecko free: ~10-30 calls/min
    if (i < lookups.length - 1) await sleep(2500);
  }

  onProgress?.({
    total: lookups.length,
    completed: lookups.length,
    found,
    current: "Done",
  });

  if (priceMap.size === 0) return txs;

  return txs.map((t) => {
    if (t.usdValue !== null) return t;
    const asset = (t.assetReceived ?? t.assetSent ?? "").toUpperCase();
    const amount = t.amountReceived ?? t.amountSent;
    if (!asset || !amount) return t;

    const day = new Date(t.timestamp).toISOString().slice(0, 10);
    const price = priceMap.get(`${asset}:${day}`);
    if (price === undefined) return t;

    return {
      ...t,
      usdValue: price * Math.abs(amount),
      reviewStatus: t.reviewStatus === "needs_review" ? "ok" as const : t.reviewStatus,
      notes: (t.notes ?? "") + ` [price: $${price.toFixed(2)} via CoinGecko]`,
    };
  });
}
