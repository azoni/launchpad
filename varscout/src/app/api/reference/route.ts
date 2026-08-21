import { NextResponse } from "next/server";
import { fetchSnapshotCached } from "@/lib/variational/api";
import { buildReference, type Reference } from "@/lib/reference/binance";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export interface ReferenceResponse {
  fetchedAt: number;
  source: "binance";
  /** Omni ticker -> global market figures. Absent means no reference coverage. */
  markets: Record<string, Reference>;
  covered: number;
  requested: number;
  error?: string;
}

/**
 * Serve global volume and 24h change for Omni's tickers.
 *
 * Proxied rather than called from the browser so every visitor shares one
 * upstream fetch behind the CDN — Binance rate-limits per IP, and a few hundred
 * clients each pulling the full ticker table would be both wasteful and fragile.
 */
export async function GET() {
  try {
    const snap = await fetchSnapshotCached(60);
    const tickers = snap.markets.map((m) => m.ticker);
    const markets = await buildReference(tickers, { spikeDepth: 40 });

    return json({
      fetchedAt: Date.now(),
      source: "binance",
      markets,
      covered: Object.keys(markets).length,
      requested: tickers.length,
    });
  } catch (e) {
    console.error("reference: build failed", e);
    // Degrade rather than fail: the screener still works on Omni's own figures.
    return json(
      {
        fetchedAt: Date.now(),
        source: "binance",
        markets: {},
        covered: 0,
        requested: 0,
        error: e instanceof Error ? e.message : "reference unavailable",
      },
      15,
    );
  }
}

function json(body: ReferenceResponse, sMaxAge = 45) {
  return NextResponse.json(body, {
    headers: {
      // 5m bars only turn over every 5 minutes; 45s keeps the page responsive
      // without re-pulling a table that has not meaningfully changed.
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=300`,
    },
  });
}
