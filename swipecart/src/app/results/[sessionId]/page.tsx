import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { recommend } from "@/lib/recommend/engine";
import type { Product, SessionProfile } from "@/lib/types";
import { ResultsClient } from "./ResultsClient";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sessionId } = await params;
  return {
    title: `Your Board Game Matches — SwipeCart`,
    description: "Personalized board game recommendations based on your preferences.",
    robots: { index: false, follow: false },
  };
}

export default async function ResultsPage({ params }: PageProps) {
  const { sessionId } = await params;

  const [profileSnap, productsSnap] = await Promise.all([
    adminDb.collection(COLLECTIONS.sessionProfiles).doc(sessionId).get(),
    adminDb
      .collection(COLLECTIONS.products)
      .where("category", "==", "board-games")
      .where("active", "==", true)
      .get(),
  ]);

  if (!profileSnap.exists) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const profile = profileSnap.data() as SessionProfile;
  const products = productsSnap.docs.map((doc) => ({
    ...doc.data(),
    asin: doc.id,
  })) as Product[];

  const allResults = recommend({ products, profile, count: 20 });

  // Categorize results
  const bestOverall = allResults.slice(0, 5);
  const bestBudget = allResults
    .filter((r) => r.product.isOnSale || (r.product.savingsPercent ?? 0) > 0)
    .slice(0, 3);
  const bestWildcard = allResults
    .filter((r) => r.breakdown.explorationBonus > 0.5)
    .slice(0, 3);

  // Serialize for client
  const serialize = (items: typeof allResults) =>
    items.map((r) => ({
      asin: r.product.asin,
      title: r.product.title,
      slug: r.product.slug,
      images: r.product.images,
      rating: r.product.rating,
      reviewCount: r.product.reviewCount,
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
      matchReason: r.matchReason,
      score: r.score,
    }));

  return (
    <ResultsClient
      sessionId={sessionId}
      bestOverall={serialize(bestOverall)}
      bestBudget={serialize(bestBudget)}
      bestWildcard={serialize(bestWildcard)}
      swipeCount={profile.swipeCount}
    />
  );
}
