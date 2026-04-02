import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import { AffiliateButton } from "./AffiliateButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProductBySlug(slug: string) {
  const snap = await adminDb
    .collection(COLLECTIONS.products)
    .where("slug", "==", slug)
    .where("active", "==", true)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { asin: snap.docs[0].id, ...snap.docs[0].data() } as Record<
    string,
    unknown
  >;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not Found — SwipeCart" };

  const playerRange = `${product.playerCountMin}-${product.playerCountMax} players`;
  const timeRange = `${product.playTimeMin}-${product.playTimeMax} min`;

  return {
    title: `${product.title}`,
    description: `${product.title}: ${playerRange}, ${timeRange}. ${(product.featureBullets as string[])?.[0] ?? "Discover this board game on SwipeCart."}`,
    alternates: { canonical: `https://swipecart-app.netlify.app/board-games/${slug}` },
    openGraph: {
      title: `${product.title} — SwipeCart`,
      description: `${playerRange}, ${timeRange}`,
      images: (product.images as string[])?.[0]
        ? [{ url: (product.images as string[])[0], width: 500, height: 500, alt: `${product.title} board game box art` }]
        : undefined,
    },
  };
}

function complexityLabel(c: number): string {
  if (c <= 1.5) return "Easy";
  if (c <= 2.5) return "Light";
  if (c <= 3.5) return "Medium";
  if (c <= 4.5) return "Heavy";
  return "Expert";
}

export default async function GamePage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const playerRange =
    product.playerCountMin === product.playerCountMax
      ? `${product.playerCountMin} player`
      : `${product.playerCountMin}-${product.playerCountMax} players`;

  const timeRange = `${product.playTimeMin}-${product.playTimeMax} min`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Image */}
        <div className="relative w-full md:w-80 aspect-square bg-muted rounded-xl shrink-0">
          {(product.images as string[])?.[0] && (
            <Image
              src={(product.images as string[])[0]}
              alt={product.title as string}
              fill
              className="object-contain p-6"
              sizes="(max-width: 768px) 100vw, 320px"
              priority
            />
          )}
          {product.isOnSale && product.savingsDisplay ? (
            <Badge className="absolute top-4 right-4 bg-red-500 text-base">
              {String(product.savingsDisplay)}
            </Badge>
          ) : null}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{product.title as string}</h1>

          {product.rating != null && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg text-amber-500">
                {"★".repeat(Math.floor(product.rating as number))}
              </span>
              <span className="text-muted-foreground">
                {(product.rating as number).toFixed(1)} / 5 ({(product.reviewCount as number)?.toLocaleString()} reviews)
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary">{playerRange}</Badge>
            <Badge variant="secondary">{timeRange}</Badge>
            <Badge variant="secondary">
              {complexityLabel(product.complexity as number)} (
              {(product.complexity as number).toFixed(1)}/5)
            </Badge>
            <Badge variant="secondary">Age {String(product.ageMin)}+</Badge>
            {product.cooperative ? (
              <Badge variant="outline">Cooperative</Badge>
            ) : null}
            {product.partyFriendly ? (
              <Badge variant="outline">Party</Badge>
            ) : null}
            {product.familyFriendly ? (
              <Badge variant="outline">Family</Badge>
            ) : null}
          </div>

          <AffiliateButton
            asin={product.asin as string}
            affiliateUrl={product.affiliateUrl as string}
          />

          <Link
            href="/swipe"
            className="inline-block mt-2 text-sm text-primary hover:underline"
          >
            Not sure? Swipe to discover games you'll love →
          </Link>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Feature bullets */}
      {(product.featureBullets as string[])?.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">About This Game</h2>
          <ul className="space-y-2">
            {(product.featureBullets as string[]).map((bullet, i) => (
              <li key={i} className="text-muted-foreground flex gap-2">
                <span className="text-primary shrink-0">-</span>
                {bullet}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Themes & Mechanics */}
      {((product.themes as string[])?.length > 0 ||
        (product.mechanics as string[])?.length > 0) && (
        <>
          <Separator className="my-8" />
          <section className="grid sm:grid-cols-2 gap-6">
            {(product.themes as string[])?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Themes</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(product.themes as string[]).map((theme) => (
                    <Badge key={theme} variant="secondary">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {(product.mechanics as string[])?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Mechanics</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(product.mechanics as string[]).slice(0, 8).map((mech) => (
                    <Badge key={mech} variant="outline">
                      {mech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://swipecart-app.netlify.app" },
              { "@type": "ListItem", position: 2, name: "Board Games", item: "https://swipecart-app.netlify.app/board-games" },
              { "@type": "ListItem", position: 3, name: product.title },
            ],
          }, {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.title,
            image: (product.images as string[])?.[0],
            description: (product.featureBullets as string[])?.[0],
            aggregateRating:
              product.rating != null
                ? {
                    "@type": "AggregateRating",
                    ratingValue: product.rating,
                    reviewCount: product.reviewCount,
                    bestRating: 5,
                  }
                : undefined,
            offers: {
              "@type": "Offer",
              url: product.affiliateUrl,
              availability:
                product.availability === "InStock"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }]),
        }}
      />
    </div>
  );
}
