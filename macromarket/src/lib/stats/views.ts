/**
 * Item popularity = lifetime food-page views, stored as a single aggregate doc
 * (see ITEM_VIEWS_DOC). One doc read serves the whole leaderboard ranking, so
 * ISR pages can re-rank hourly without denting the Firestore read quota.
 * Degrades to {} when Firebase isn't configured or the read fails.
 */
import { getAdminDb } from "@/lib/firebase/admin";
import { ITEM_VIEWS_DOC } from "@/lib/firebase/collections";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("firestore-timeout")), ms),
    ),
  ]);
}

export async function getItemViews(): Promise<Record<string, number>> {
  const db = getAdminDb();
  if (!db) return {};
  try {
    const snap = await withTimeout(db.doc(ITEM_VIEWS_DOC).get(), 5000);
    const counts = (snap.data()?.counts ?? {}) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [slug, n] of Object.entries(counts)) {
      const v = Number(n);
      if (Number.isFinite(v) && v > 0) out[slug] = v;
    }
    return out;
  } catch {
    return {};
  }
}
