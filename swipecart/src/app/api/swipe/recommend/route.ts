import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { recommend } from "@/lib/recommend/engine";
import type { Product, SessionProfile } from "@/lib/types";

/** GET /api/swipe/recommend?sessionId=X&count=5 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const count = parseInt(searchParams.get("count") ?? "5", 10);

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  // Fetch profile and all active products in parallel
  const [profileSnap, productsSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.sessionProfiles).doc(sessionId).get(),
    adminDb
      .collection(COLLECTIONS.products)
      .where("category", "==", "board-games")
      .where("active", "==", true)
      .get(),
  ]);

  if (!profileSnap.exists) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  const profile = profileSnap.data() as SessionProfile;
  const products = productsSnap.docs.map((doc) => ({
    ...doc.data(),
    asin: doc.id,
  })) as Product[];

  const recommendations = recommend({ products, profile, count });

  return NextResponse.json({
    products: recommendations.map((r) => ({
      asin: r.product.asin,
      title: r.product.title,
      slug: r.product.slug,
      images: r.product.images,
      rating: r.product.rating,
      reviewCount: r.product.reviewCount,
      savingsPercent: r.product.savingsPercent,
      savingsDisplay: r.product.savingsDisplay,
      isOnSale: r.product.isOnSale,
      affiliateUrl: r.product.affiliateUrl,
      playerCountMin: r.product.playerCountMin,
      playerCountMax: r.product.playerCountMax,
      playTimeMin: r.product.playTimeMin,
      playTimeMax: r.product.playTimeMax,
      complexity: r.product.complexity,
      cooperative: r.product.cooperative,
      themes: r.product.themes,
      featureBullets: r.product.featureBullets,
      score: r.score,
      matchReason: r.matchReason,
    })),
    swipeCount: profile.swipeCount,
  });
}
