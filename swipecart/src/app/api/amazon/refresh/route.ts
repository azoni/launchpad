import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getItems } from "@/lib/amazon/client";
import { affiliateUrl } from "@/lib/amazon/asin";
import { FieldValue } from "firebase-admin/firestore";

/** POST /api/amazon/refresh — Refresh product data from Amazon Creators API.
 *  Protected by CRON_SECRET. Intended to run every 6 hours via Vercel Cron. */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productsSnap = await adminDb
    .collection(COLLECTIONS.products)
    .where("active", "==", true)
    .get();

  const allAsins = productsSnap.docs.map((doc) => doc.id);
  let updated = 0;
  let failed = 0;

  // Process in batches of 10
  for (let i = 0; i < allAsins.length; i += 10) {
    const batch = allAsins.slice(i, i + 10);

    try {
      const amazonData = await getItems(batch);

      for (const asin of batch) {
        const product = amazonData.get(asin);
        if (!product) {
          failed++;
          continue;
        }

        await adminDb
          .collection(COLLECTIONS.products)
          .doc(asin)
          .update({
            rating: product.rating,
            reviewCount: product.reviewCount,
            featureBullets: product.featureBullets,
            images: product.images,
            savingsPercent: product.savingsPercent,
            savingsDisplay: product.savingsDisplay,
            isOnSale: (product.savingsPercent ?? 0) >= 10,
            availability: product.availability,
            affiliateUrl: affiliateUrl(asin),
            lastAmazonSync: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });

        updated++;
      }
    } catch (e) {
      console.error(`Batch refresh error for ASINs ${batch.join(",")}:`, e);
      failed += batch.length;
    }

    // Rate limit between batches (API client handles per-request, but be safe)
    if (i + 10 < allAsins.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return NextResponse.json({
    total: allAsins.length,
    updated,
    failed,
  });
}
