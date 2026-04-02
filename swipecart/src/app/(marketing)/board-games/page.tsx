import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Best Board Games 2026",
  description:
    "Browse our curated collection of top board games. Filter by player count, complexity, and theme. Find your perfect game with swipe-based discovery.",
  alternates: { canonical: "https://swipecart-app.netlify.app/board-games" },
  openGraph: {
    title: "Best Board Games 2026 — SwipeCart",
    description: "Top board games curated and rated. Find your next favorite.",
  },
};

export default async function BoardGamesPage() {
  let products: Record<string, unknown>[] = [];
  try {
    const productsSnap = await adminDb
      .collection(COLLECTIONS.products)
      .where("category", "==", "board-games")
      .where("active", "==", true)
      .orderBy("popularityScore", "desc")
      .get();

    products = productsSnap.docs.map((doc) => ({
      asin: doc.id,
      ...doc.data(),
    }));
  } catch {
    // Index may not be ready yet — fall back to unordered query
    try {
      const fallbackSnap = await adminDb
        .collection(COLLECTIONS.products)
        .where("active", "==", true)
        .get();
      products = fallbackSnap.docs.map((doc) => ({
        asin: doc.id,
        ...doc.data(),
      }));
    } catch {
      // Empty collection — that's fine for initial deploy
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Board Games</h1>
        <p className="text-muted-foreground mt-2">
          {products.length} curated games, ranked by community ratings and
          expert reviews.{" "}
          <Link href="/swipe" className="text-primary hover:underline">
            Or let us pick for you →
          </Link>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product: Record<string, unknown>) => {
          const playerRange =
            product.playerCountMin === product.playerCountMax
              ? `${product.playerCountMin}p`
              : `${product.playerCountMin}-${product.playerCountMax as number}p`;

          return (
            <Link
              key={product.asin as string}
              href={`/board-games/${product.slug}`}
              className="border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors group"
            >
              <div className="relative aspect-[4/3] bg-muted">
                {(product.images as string[])?.[0] && (
                  <Image
                    src={(product.images as string[])[0]}
                    alt={product.title as string}
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
                {product.isOnSale ? (
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    {String(product.savingsDisplay)}
                  </Badge>
                ) : null}
              </div>
              <div className="p-3">
                <h2 className="font-semibold line-clamp-1">
                  {product.title as string}
                </h2>
                {product.rating != null && (
                  <div className="text-sm text-amber-500">
                    {"★".repeat(Math.floor(product.rating as number))}{" "}
                    <span className="text-muted-foreground">
                      ({(product.reviewCount as number)?.toLocaleString()})
                    </span>
                  </div>
                )}
                <div className="flex gap-1 mt-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {playerRange}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {product.playTimeMin as number}-{product.playTimeMax as number}m
                  </Badge>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Best Board Games",
            description: "Curated collection of top board games.",
            numberOfItems: products.length,
            itemListElement: products.slice(0, 20).map(
              (p: Record<string, unknown>, i: number) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Product",
                  name: p.title,
                  image: (p.images as string[])?.[0],
                  url: `/board-games/${p.slug}`,
                },
              })
            ),
          }),
        }}
      />
    </div>
  );
}
