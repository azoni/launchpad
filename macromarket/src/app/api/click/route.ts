import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Logs an affiliate click (Firestore when configured; always 204). Fire-and-forget from the client. */
export async function POST(req: Request) {
  try {
    const { slug, asin, source } = (await req.json()) as {
      slug?: string;
      asin?: string | null;
      source?: string;
    };
    const db = getAdminDb();
    if (db && slug) {
      await db.collection(COLLECTIONS.affiliateClicks).add({
        slug,
        asin: asin ?? null,
        source: source ?? "unknown",
        ts: FieldValue.serverTimestamp(),
      });
    }
  } catch {
    /* never fail a click */
  }
  return new Response(null, { status: 204 });
}
