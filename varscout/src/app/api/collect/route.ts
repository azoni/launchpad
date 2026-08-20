import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  META,
  META_COLLECTOR,
  MIN_STORE_VOLUME,
  SNAPSHOTS,
  SNAPSHOT_RETENTION_DAYS,
  STATS,
  STATS_CURRENT,
} from "@/lib/firebase/collections";
import { fetchSnapshot } from "@/lib/variational/api";
import { accumulate, type Accum } from "@/lib/variational/history";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Fold one poll of the Variational endpoint into the rolling aggregates.
 *
 * Reads one document, writes two. Cost is flat in the amount of history
 * accumulated, because the statistics are kept as incremental sums rather than
 * recomputed from stored snapshots.
 */
export async function POST(req: Request) {
  const expected = process.env.MCP_ADMIN_KEY;
  const auth = req.headers.get("authorization");
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "firebase not configured" }, { status: 503 });

  let snap;
  try {
    snap = await fetchSnapshot();
  } catch (e) {
    console.error("collect: upstream fetch failed", e);
    return NextResponse.json({ error: "upstream fetch failed" }, { status: 502 });
  }

  const nowS = Math.floor(snap.fetchedAt / 1000);
  const statsRef = db.collection(STATS).doc(STATS_CURRENT);

  const existing = (await statsRef.get()).data() as
    | { accums?: Record<string, Accum>; runs?: number }
    | undefined;
  const accums: Record<string, Accum> = existing?.accums ?? {};

  // Only track markets with enough volume to be tradeable. Storing all 543
  // would bloat the document past Firestore's 1MB limit as series accumulate.
  const tracked = snap.markets.filter((m) => m.vol24 >= MIN_STORE_VOLUME);
  for (const m of tracked) {
    accums[m.ticker] = accumulate(accums[m.ticker], m, nowS);
  }

  // Drop markets that have fallen out of the tracked set so the document does
  // not grow without bound as listings churn.
  const live = new Set(tracked.map((m) => m.ticker));
  for (const ticker of Object.keys(accums)) {
    if (!live.has(ticker) && nowS - (accums[ticker].lastTs ?? 0) > 7 * 86400) {
      delete accums[ticker];
    }
  }

  await statsRef.set(
    {
      updatedAt: snap.fetchedAt,
      platform: snap.platform,
      trackedCount: tracked.length,
      runs: (existing?.runs ?? 0) + 1,
      accums,
    },
    { merge: false },
  );

  // Packed snapshot, kept for future backtesting. Keyed by ticker with short
  // field names — Firestore rejects nested arrays, so an array of tuples is not
  // an option, and a map avoids repeating the ticker as a field.
  const rows: Record<string, Record<string, number>> = {};
  for (const m of tracked) {
    rows[m.ticker] = {
      m: m.mark,
      f: m.funding,
      v: m.vol24,
      l: m.oiLong,
      s: m.oiShort,
      b: m.spreadBps,
    };
  }
  await db.collection(SNAPSHOTS).doc(String(nowS)).set({ ts: nowS, platform: snap.platform, rows });

  // Prune on a fraction of runs — the query costs reads, and retention is not
  // time-critical. At 5-minute polling this fires roughly twice a day.
  let pruned = 0;
  if (Math.floor(nowS / 300) % 144 === 0) {
    const cutoff = nowS - SNAPSHOT_RETENTION_DAYS * 86400;
    const old = await db.collection(SNAPSHOTS).where("ts", "<", cutoff).limit(400).get();
    if (!old.empty) {
      const batch = db.batch();
      old.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      pruned = old.size;
    }
  }

  const result = {
    ok: true,
    ts: nowS,
    marketsSeen: snap.markets.length,
    tracked: tracked.length,
    accumulated: Object.keys(accums).length,
    pruned,
  };
  await db.collection(META).doc(META_COLLECTOR).set({ ...result, at: snap.fetchedAt });
  return NextResponse.json(result);
}
