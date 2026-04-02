"use client";

import { trackEvent } from "@/lib/analytics/posthog";

interface BundleShareButtonProps {
  title: string;
  bundleId: string;
}

export function BundleShareButton({ title, bundleId }: BundleShareButtonProps) {
  async function handleShare() {
    const url = `${window.location.origin}/bundle/${bundleId}`;

    trackEvent({
      event: "bundle_shared",
      properties: {
        bundle_id: bundleId,
        product_count: 0, // Could pass from parent
      },
    });

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <button
      onClick={handleShare}
      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold"
    >
      Share This Bundle
    </button>
  );
}
