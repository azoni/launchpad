"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics/posthog";

interface ResultProduct {
  asin: string;
  title: string;
  slug: string;
  images: string[];
  rating: number | null;
  reviewCount: number | null;
  savingsDisplay: string | null;
  isOnSale: boolean;
  affiliateUrl: string;
  playerCountMin: number;
  playerCountMax: number;
  playTimeMin: number;
  playTimeMax: number;
  complexity: number;
  cooperative: boolean;
  themes: string[];
  matchReason: string;
  score: number;
}

interface ResultsClientProps {
  sessionId: string;
  bestOverall: ResultProduct[];
  bestBudget: ResultProduct[];
  bestWildcard: ResultProduct[];
  swipeCount: number;
}

function ProductResultCard({ product }: { product: ResultProduct }) {
  const handleAffiliateClick = () => {
    trackEvent({
      event: "affiliate_click",
      properties: {
        product_asin: product.asin,
        source: "results",
      },
    });
  };

  const playerRange =
    product.playerCountMin === product.playerCountMax
      ? `${product.playerCountMin}p`
      : `${product.playerCountMin}-${product.playerCountMax}p`;

  return (
    <Card className="overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="relative w-24 h-24 shrink-0 bg-muted rounded-lg">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.title}
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
            {product.title}
          </Link>

          {product.rating != null && (
            <div className="text-sm text-amber-500 mt-0.5">
              {"★".repeat(Math.floor(product.rating))}{" "}
              <span className="text-muted-foreground">
                ({product.reviewCount?.toLocaleString()})
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-1 mt-1.5">
            <Badge variant="secondary" className="text-xs">
              {playerRange}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {product.playTimeMin}-{product.playTimeMax}m
            </Badge>
            {product.cooperative && (
              <Badge variant="outline" className="text-xs">
                Co-op
              </Badge>
            )}
            {product.isOnSale && product.savingsDisplay && (
              <Badge className="text-xs bg-red-500">
                {product.savingsDisplay}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
            {product.matchReason}
          </p>

          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAffiliateClick}
            className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
          >
            View on Amazon →
          </a>
        </CardContent>
      </div>
    </Card>
  );
}

export function ResultsClient({
  sessionId,
  bestOverall,
  bestBudget,
  bestWildcard,
  swipeCount,
}: ResultsClientProps) {
  useEffect(() => {
    trackEvent({
      event: "results_viewed",
      properties: {
        session_id: sessionId,
        product_count: bestOverall.length + bestBudget.length + bestWildcard.length,
      },
    });
  }, [sessionId, bestOverall.length, bestBudget.length, bestWildcard.length]);

  return (
    <div className="min-h-screen pb-12">
      <header className="p-6 text-center">
        <h1 className="text-2xl font-bold">Your Matches</h1>
        <p className="text-muted-foreground">
          Based on {swipeCount} swipes
        </p>
      </header>

      <div className="max-w-lg mx-auto px-4 space-y-8">
        {/* Best overall */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Best Overall</h2>
          <div className="space-y-3">
            {bestOverall.map((product) => (
              <ProductResultCard key={product.asin} product={product} />
            ))}
          </div>
        </section>

        {/* Best budget */}
        {bestBudget.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Best Deals</h2>
            <div className="space-y-3">
              {bestBudget.map((product) => (
                <ProductResultCard key={product.asin} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Wildcards */}
        {bestWildcard.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Try Something New</h2>
            <div className="space-y-3">
              {bestWildcard.map((product) => (
                <ProductResultCard key={product.asin} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href={`/swipe`}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-center"
          >
            Swipe Again
          </Link>
          <button
            onClick={async () => {
              // Create a bundle from top 3
              const top3 = bestOverall.slice(0, 3);
              try {
                const res = await fetch("/api/bundle", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    sessionId,
                    title: "My Game Night Bundle",
                    scenario: "custom",
                    productIds: top3.map((p) => p.asin),
                  }),
                });
                const data = await res.json();
                if (data.url) {
                  window.location.href = data.url;
                }
              } catch {
                // Silently fail
              }
            }}
            className="w-full border border-border py-3 rounded-lg font-semibold text-center hover:bg-muted transition-colors"
          >
            Create a Bundle
          </button>
        </div>
      </div>
    </div>
  );
}
