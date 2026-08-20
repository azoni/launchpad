import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { STATS, STATS_CURRENT } from "@/lib/firebase/collections";
import { derive, type Accum } from "@/lib/variational/history";
import type { MarketHistory, Platform } from "@/lib/variational/types";

export const dynamic = "force-dynamic";

export interface AggregatesResponse {
  updatedAt: number | null;
  runs: number;
  platform: Platform | null;
  /** Per-ticker derived history. Empty object when the collector hasn't run yet. */
  histories: Record<string, MarketHistory>;
}

/**
 * Serve the collector's rolling history to the browser.
 *
 * The browser never reads Firestore directly — this route is CDN-cached, so a
 * hundred visitors in a cache window cost one Firestore read rather than a
 * hundred. Sign stability depends on the *current* funding sign, which the
 * client knows and the server doesn't, so that is derived client-side from the
 * raw counters returned here.
 */
export async function GET() {
  const db = getAdminDb();
  const empty: AggregatesResponse = { updatedAt: null, runs: 0, platform: null, histories: {} };

  if (!db) return json(empty, 30);

  try {
    const doc = await db.collection(STATS).doc(STATS_CURRENT).get();
    const data = doc.data() as
      | { updatedAt?: number; runs?: number; platform?: Platform; accums?: Record<string, Accum> }
      | undefined;

    if (!data?.accums) return json(empty, 30);

    const histories: Record<string, MarketHistory> = {};
    for (const [ticker, a] of Object.entries(data.accums)) {
      // Pass the last observed funding so signStability is measured against the
      // sign the market currently has. The client re-derives it against live
      // funding when that differs.
      const series = a.fSeries ?? [];
      const last = series.length ? series[series.length - 1] : 0;
      histories[ticker] = { ...derive(a, last), posN: a.posN, negN: a.negN } as MarketHistory & {
        posN: number;
        negN: number;
      };
    }

    return json(
      {
        updatedAt: data.updatedAt ?? null,
        runs: data.runs ?? 0,
        platform: data.platform ?? null,
        histories,
      },
      120,
    );
  } catch (e) {
    console.error("aggregates: read failed", e);
    return json(empty, 15);
  }
}

function json(body: AggregatesResponse, sMaxAge: number) {
  return NextResponse.json(body, {
    headers: {
      // Collector runs every 5 min, so a 2-minute edge cache never serves data
      // meaningfully staler than the source while collapsing visitor reads.
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=600`,
    },
  });
}
