import { totalProteinGForSlug } from "@/lib/catalog/protein";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLICK_LIMIT = 4000;

/**
 * Public running total of protein grams from affiliate clicks — summed straight
 * from the clicks that are already logged. Cached 60s. Powers the navbar counter.
 */
export async function GET() {
  let grams = 0;
  let clicks = 0;
  try {
    const db = getAdminDb();
    if (db) {
      const snap = await db
        .collection(COLLECTIONS.affiliateClicks)
        .select("slug")
        .limit(CLICK_LIMIT)
        .get();
      clicks = snap.size;
      for (const doc of snap.docs) {
        grams += totalProteinGForSlug(String(doc.get("slug") ?? ""));
      }
    }
  } catch {
    /* return zeros on any failure */
  }
  return new Response(JSON.stringify({ grams, clicks }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
