// Historical price lookup via CoinGecko free API.
// Accepts an array of { asset, timestamp } pairs and returns USD prices.
//
// CoinGecko free tier: 10-30 calls/min, no key needed.
// Uses /coins/{id}/history endpoint for historical prices.
// Caches results in-memory per function invocation.

import type { Handler } from "@netlify/functions";

// Map common crypto symbols to CoinGecko IDs
const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
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
  SRM: "serum",
  "mSOL": "msol",
  WETH: "weth",
  WBTC: "wrapped-bitcoin",
  LINK: "chainlink",
  UNI: "uniswap",
  AAVE: "aave",
  ARB: "arbitrum",
  OP: "optimism",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
};

// Stablecoins — always $1.00, skip API call
const STABLES = new Set(["USDC", "USDT", "DAI", "BUSD", "TUSD", "FRAX", "PYUSD", "USD"]);

interface PriceRequest {
  asset: string;
  timestamp: number; // unix ms
}

interface PriceResult {
  asset: string;
  timestamp: number;
  priceUsd: number | null;
  source: string;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getUTCDate()).padStart(2, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${d.getUTCFullYear()}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCoinGeckoPrice(
  coinId: string,
  dateStr: string
): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${dateStr}&localization=false`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        // Rate limited — wait and retry once
        await sleep(5000);
        const retry = await fetch(url);
        if (!retry.ok) return null;
        const data = (await retry.json()) as { market_data?: { current_price?: { usd?: number } } };
        return data.market_data?.current_price?.usd ?? null;
      }
      return null;
    }
    const data = (await res.json()) as { market_data?: { current_price?: { usd?: number } } };
    return data.market_data?.current_price?.usd ?? null;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  let body: { requests?: PriceRequest[] };
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const requests = body.requests ?? [];
  if (requests.length === 0) {
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ results: [] }),
    };
  }

  // Deduplicate: same asset + same date → one API call
  const cache = new Map<string, number | null>();
  const results: PriceResult[] = [];

  for (const req of requests) {
    const symbol = req.asset.toUpperCase();

    // Stablecoins
    if (STABLES.has(symbol)) {
      results.push({
        asset: req.asset,
        timestamp: req.timestamp,
        priceUsd: 1.0,
        source: "stablecoin",
      });
      continue;
    }

    const coinId = COINGECKO_IDS[symbol];
    if (!coinId) {
      results.push({
        asset: req.asset,
        timestamp: req.timestamp,
        priceUsd: null,
        source: "unknown_asset",
      });
      continue;
    }

    const dateStr = formatDate(req.timestamp);
    const cacheKey = `${coinId}:${dateStr}`;

    if (cache.has(cacheKey)) {
      results.push({
        asset: req.asset,
        timestamp: req.timestamp,
        priceUsd: cache.get(cacheKey)!,
        source: "coingecko_cached",
      });
      continue;
    }

    // Rate limit: wait between calls
    await sleep(2500); // CoinGecko free: ~25 calls/min
    const price = await fetchCoinGeckoPrice(coinId, dateStr);
    cache.set(cacheKey, price);

    results.push({
      asset: req.asset,
      timestamp: req.timestamp,
      priceUsd: price,
      source: price !== null ? "coingecko" : "not_found",
    });
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ results }),
  };
};
