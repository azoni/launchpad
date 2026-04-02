import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { FieldValue } from "firebase-admin/firestore";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 6);
}

/** POST /api/bundle — Create a new bundle. */
export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, title, scenario, productIds } = body as {
    sessionId: string | null;
    title: string;
    scenario: string;
    productIds: string[];
  };

  if (!title || !productIds || productIds.length === 0) {
    return NextResponse.json(
      { error: "title and productIds are required" },
      { status: 400 }
    );
  }

  const slug = `${slugify(title)}-${shortId()}`;

  await adminDb
    .collection(COLLECTIONS.bundles)
    .doc(slug)
    .set({
      sessionId: sessionId ?? null,
      title,
      slug,
      scenario,
      productIds,
      createdAt: FieldValue.serverTimestamp(),
    });

  return NextResponse.json({ slug, url: `/bundle/${slug}` });
}

/** GET /api/bundle?slug=X — Fetch a bundle by slug. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "slug is required" },
      { status: 400 }
    );
  }

  const bundleSnap = await adminDb
    .collection(COLLECTIONS.bundles)
    .doc(slug)
    .get();

  if (!bundleSnap.exists) {
    return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
  }

  const bundle = bundleSnap.data()!;

  // Fetch the products in the bundle
  const productDocs = await Promise.all(
    (bundle.productIds as string[]).map((asin) =>
      adminDb.collection(COLLECTIONS.products).doc(asin).get()
    )
  );

  const products = productDocs
    .filter((doc) => doc.exists)
    .map((doc) => ({ asin: doc.id, ...doc.data() }));

  return NextResponse.json({ bundle, products });
}
