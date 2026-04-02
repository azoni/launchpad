import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BundleShareButton } from "./BundleShareButton";

interface PageProps {
  params: Promise<{ bundleId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bundleId } = await params;
  const bundleSnap = await adminDb
    .collection(COLLECTIONS.bundles)
    .doc(bundleId)
    .get();

  if (!bundleSnap.exists) {
    return { title: "Bundle Not Found — MeepleMatch" };
  }

  const bundle = bundleSnap.data()!;
  return {
    title: `${bundle.title} — MeepleMatch`,
    description: `A curated board game bundle: ${bundle.title}. ${(bundle.productIds as string[]).length} games picked just for you.`,
    openGraph: {
      title: bundle.title as string,
      description: `Check out this board game bundle on MeepleMatch`,
      type: "website",
    },
  };
}

export default async function BundlePage({ params }: PageProps) {
  const { bundleId } = await params;

  const bundleSnap = await adminDb
    .collection(COLLECTIONS.bundles)
    .doc(bundleId)
    .get();

  if (!bundleSnap.exists) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Bundle not found.</p>
      </div>
    );
  }

  const bundle = bundleSnap.data()!;
  const productDocs = await Promise.all(
    (bundle.productIds as string[]).map((asin) =>
      adminDb.collection(COLLECTIONS.products).doc(asin).get()
    )
  );
  const products = productDocs
    .filter((doc) => doc.exists)
    .map((doc) => ({ asin: doc.id, ...doc.data() }));

  return (
    <div className="min-h-screen pb-12">
      <header className="p-6 text-center">
        <h1 className="text-2xl font-bold">{bundle.title}</h1>
        <p className="text-muted-foreground">
          {products.length} games for your {bundle.scenario} night
        </p>
      </header>

      <div className="max-w-lg mx-auto px-4 space-y-4">
        {products.map((product: Record<string, unknown>) => (
          <Card key={product.asin as string} className="overflow-hidden">
            <div className="flex gap-4 p-4">
              <div className="relative w-24 h-24 shrink-0 bg-muted rounded-lg">
                {(product.images as string[])?.[0] && (
                  <Image
                    src={(product.images as string[])[0]}
                    alt={product.title as string}
                    fill
                    className="object-contain p-1"
                    sizes="96px"
                  />
                )}
              </div>
              <CardContent className="p-0 flex-1">
                <Link
                  href={`/board-games/${product.slug}`}
                  className="font-semibold hover:underline line-clamp-2"
                >
                  {product.title as string}
                </Link>

                {product.rating != null && (
                  <div className="text-sm text-amber-500 mt-0.5">
                    {"★".repeat(Math.floor(product.rating as number))}{" "}
                    <span className="text-muted-foreground">
                      ({(product.reviewCount as number)?.toLocaleString()})
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mt-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {String(product.playerCountMin)}-{String(product.playerCountMax)}p
                  </Badge>
                  {product.cooperative ? (
                    <Badge variant="outline" className="text-xs">
                      Co-op
                    </Badge>
                  ) : null}
                </div>

                <a
                  href={product.affiliateUrl as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
                >
                  View on Amazon →
                </a>
              </CardContent>
            </div>
          </Card>
        ))}

        <div className="flex flex-col gap-3 pt-4">
          <BundleShareButton
            title={bundle.title as string}
            bundleId={bundleId}
          />
          <Link
            href="/swipe"
            className="w-full border border-border py-3 rounded-lg font-semibold text-center hover:bg-muted transition-colors"
          >
            Build Your Own
          </Link>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: bundle.title,
            numberOfItems: products.length,
            itemListElement: products.map(
              (p: Record<string, unknown>, i: number) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Product",
                  name: p.title,
                  image: (p.images as string[])?.[0],
                  url: `https://www.amazon.com/dp/${p.asin}?tag=oldwaystoda00-20`,
                },
              })
            ),
          }),
        }}
      />
    </div>
  );
}
