import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public running total of protein grams from affiliate clicks (a single aggregate
 * doc — one read). Powers the navbar counter. Cached 60s.
 */
export async function GET() {
  let grams = 0;
  let clicks = 0;
  try {
    const db = getAdminDb();
    if (db) {
      const snap = await db
        .collection(COLLECTIONS.aggregates)
        .doc("proteinShopped")
        .get();
      const d = snap.data();
      grams = Number(d?.grams ?? 0);
      clicks = Number(d?.clicks ?? 0);
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
