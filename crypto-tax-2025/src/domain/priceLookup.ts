// Client-side price lookup. Calls the Netlify Function in batches to
// fill USD values on normalized transactions that are missing prices.
// Batches requests to avoid overwhelming CoinGecko's rate limit.

import type { NormalizedTransaction } from "../types";

interface PriceResult {
  asset: string;
  timestamp: number;
  priceUsd: number | null;
  source: string;
}

export async function fillMissingPrices(
  txs: NormalizedTransaction[]
): Promise<NormalizedTransaction[]> {
  // Find rows missing USD values
  const needsPrice = txs.filter(
    (t) =>
      t.usdValue === null &&
      (t.assetReceived || t.assetSent) &&
      (t.amountReceived || t.amountSent)
  );

  if (needsPrice.length === 0) return txs;

  // Build unique asset+date pairs to look up
  const requests: Array<{ asset: string; timestamp: number }> = [];
  const seen = new Set<string>();

  for (const t of needsPrice) {
    const asset = t.assetReceived ?? t.assetSent ?? "";
    if (!asset) continue;
    // Deduplicate by asset + date (same price for same day)
    const day = new Date(t.timestamp).toISOString().slice(0, 10);
    const key = `${asset}:${day}`;
    if (seen.has(key)) continue;
    seen.add(key);
    requests.push({ asset, timestamp: t.timestamp });
  }

  if (requests.length === 0) return txs;

  // Call price lookup in batches of 20 (to stay within function timeout)
  const priceMap = new Map<string, number>();
  const BATCH = 20;

  for (let i = 0; i < requests.length; i += BATCH) {
    const batch = requests.slice(i, i + BATCH);
    try {
      const res = await fetch("/api/price-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests: batch }),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { results: PriceResult[] };
      for (const r of data.results) {
        if (r.priceUsd !== null) {
          const day = new Date(r.timestamp).toISOString().slice(0, 10);
          priceMap.set(`${r.asset}:${day}`, r.priceUsd);
        }
      }
    } catch {
      // Price lookup failure is non-fatal — rows stay as needs_review
      continue;
    }
  }

  if (priceMap.size === 0) return txs;

  // Apply prices to transactions
  return txs.map((t) => {
    if (t.usdValue !== null) return t;
    const asset = t.assetReceived ?? t.assetSent;
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
