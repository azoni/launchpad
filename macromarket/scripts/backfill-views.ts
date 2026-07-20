/**
 * One-time seed of the popularity ranking: aggregate existing affiliateClicks
 * into aggregates/itemViews so "Most popular" isn't all-zeros on launch.
 * Idempotent — refuses to run if the doc is already backfilled.
 *
 * Run (FIREBASE_SERVICE_ACCOUNT_KEY in env): npx tsx scripts/backfill-views.ts
 */
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../src/lib/firebase/admin";
import { COLLECTIONS, ITEM_VIEWS_DOC } from "../src/lib/firebase/collections";

async function main() {
  const db = getAdminDb();
  if (!db) throw new Error("Firebase not configured (FIREBASE_SERVICE_ACCOUNT_KEY)");

  const ref = db.doc(ITEM_VIEWS_DOC);
  const existing = await ref.get();
  if (existing.data()?.backfilledAt) {
    console.log("Already backfilled — nothing to do.");
    return;
  }

  const snap = await db
    .collection(COLLECTIONS.affiliateClicks)
    .limit(2000)
    .get();
  const counts: Record<string, number> = {};
  for (const doc of snap.docs) {
    const slug = String(doc.data().slug ?? "");
    if (slug) counts[slug] = (counts[slug] ?? 0) + 1;
  }

  // increment (not overwrite) so any views that landed before the backfill survive
  const increments: Record<string, FieldValue> = {};
  for (const [slug, n] of Object.entries(counts)) {
    increments[slug] = FieldValue.increment(n);
  }
  await ref.set(
    { counts: increments, backfilledAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  console.log(
    `Seeded ${Object.keys(counts).length} items from ${snap.size} clicks:`,
    Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10),
  );
}

main();
