import { NextResponse } from "next/server";
import { fetchSnapshotCached } from "@/lib/variational/api";
import { buildReference, type Reference } from "@/lib/reference/sources";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export interface ReferenceResponse {
  fetchedAt: number;
  /** Which venue actually answered, or null if every one refused. */
  source: string | null;
  /** Per-source outcome, so a geo-block shows up as a diagnosis not a blank page. */
  attempts: { source: string; ok: boolean; detail?: string }[];
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
 * upstream fetch behind the CDN — these venues rate-limit per IP, and a few
 * hundred clients each pulling a full ticker table would be wasteful and fragile.
 */
export async function GET() {
  try {
    const snap = await fetchSnapshotCached(60);
    const tickers = snap.markets.map((m) => m.ticker);
    const { markets, source, attempts } = await buildReference(tickers, { spikeDepth: 40 });

    if (!source) {
      console.error("reference: every source refused", attempts);
      return json(
        {
          fetchedAt: Date.now(),
          source: null,
          attempts,
          markets: {},
          covered: 0,
          requested: tickers.length,
          error: "no reference source reachable",
        },
        20,
      );
    }

    return json({
      fetchedAt: Date.now(),
      source,
      attempts,
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
        source: null,
        attempts: [],
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
