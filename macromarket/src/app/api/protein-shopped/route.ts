import { totalProteinGForSlug } from "@/lib/catalog/protein";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLICK_LIMIT = 4000;

/**
 * Public running total of protein grams from affiliate clicks — summed from the
 * logged clicks. Cached 5 min to keep Firestore reads low. Powers the navbar counter.
 */
export async function GET() {
  let grams = 0;
  let clicks = 0;
  try {
    const db = getAdminDb();
    if (db) {
      const snap = await db
        .collection(COLLECTIONS.affiliateClicks)
        .orderBy("ts", "desc")
        .limit(CLICK_LIMIT)
        .get();
      clicks = snap.size;
      for (const doc of snap.docs) {
        grams += totalProteinGForSlug(String(doc.data().slug ?? ""));
      }
    }
  } catch {
    /* e.g. Firestore quota — return zeros; the counter simply hides */
  }
  return new Response(JSON.stringify({ grams, clicks }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
