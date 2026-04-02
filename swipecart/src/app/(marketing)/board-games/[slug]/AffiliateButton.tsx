"use client";

import { trackEvent } from "@/lib/analytics/posthog";

interface AffiliateButtonProps {
  asin: string;
  affiliateUrl: string;
}

export function AffiliateButton({ asin, affiliateUrl }: AffiliateButtonProps) {
  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent({
          event: "affiliate_click",
          properties: {
            product_asin: asin,
            source: "seo_page",
          },
        });
      }}
      className="inline-block mt-4 bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
    >
      View on Amazon
    </a>
  );
}
