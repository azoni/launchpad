import { FieldValue } from "firebase-admin/firestore";
import { CATALOG } from "@/data/catalog";
import { getAdminDb } from "@/lib/firebase/admin";
import { ITEM_VIEWS_DOC } from "@/lib/firebase/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SLUGS = new Set(CATALOG.map((c) => c.id));

/**
 * Item-view beacon (fire-and-forget from the food page; always 204).
 * One increment on the single aggregate doc — never a per-view document.
 */
export async function POST(req: Request) {
  try {
    const { slug } = (await req.json()) as { slug?: string };
    const db = getAdminDb();
    if (db && slug && VALID_SLUGS.has(slug)) {
      await db.doc(ITEM_VIEWS_DOC).set(
        {
          counts: { [slug]: FieldValue.increment(1) },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  } catch {
    /* never fail a page view */
  }
  return new Response(null, { status: 204 });
}
