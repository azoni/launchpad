import { totalProteinGForSlug } from "@/lib/catalog/protein";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLICK_LIMIT = 4000;

export async function GET(req: Request) {
  const debug = new URL(req.url).searchParams.get("debug") === "1";
  let grams = 0;
  let clicks = 0;
  const dbg: Record<string, unknown> = {};
  try {
    const db = getAdminDb();
    dbg.db = !!db;
    if (db) {
      const snap = await db
        .collection(COLLECTIONS.affiliateClicks)
        .orderBy("ts", "desc")
        .limit(CLICK_LIMIT)
        .get();
      dbg.size = snap.size;
      clicks = snap.size;
      let sampleSlug = "";
      for (const doc of snap.docs) {
        const slug = String(doc.data().slug ?? "");
        if (!sampleSlug) sampleSlug = slug;
        grams += totalProteinGForSlug(slug);
      }
      dbg.sampleSlug = sampleSlug;
      dbg.sampleGrams = totalProteinGForSlug(sampleSlug);
    }
  } catch (e) {
    dbg.error = (e as Error)?.message ?? String(e);
  }
  return new Response(
    JSON.stringify(debug ? { grams, clicks, ...dbg } : { grams, clicks }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": debug ? "no-store" : "public, max-age=60, s-maxage=60",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
