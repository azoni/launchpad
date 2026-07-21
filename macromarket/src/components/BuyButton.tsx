"use client";

import { ShoppingCart } from "lucide-react";
import { trackEvent } from "@/lib/analytics/posthog";
import { cn } from "@/lib/utils";

type ClickSource =
  | "leaderboard"
  | "detail"
  | "category"
  | "compare"
  | "collection"
  | "calculator"
  | "coach";

export function BuyButton({
  slug,
  asin,
  buyUrl,
  source,
  label = "Buy on Amazon",
  className,
  variant = "primary",
}: {
  slug: string;
  asin: string | null;
  buyUrl: string;
  source: ClickSource;
  label?: string;
  className?: string;
  variant?: "primary" | "amber" | "small";
}) {
  function onClick() {
    try {
      trackEvent("affiliate_click", { slug, asin, source });
      const body = JSON.stringify({ slug, asin, source });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/click",
          new Blob([body], { type: "application/json" }),
        );
      } else {
        fetch("/api/click", { method: "POST", body, keepalive: true }).catch(
          () => {},
        );
      }
    } catch {
      /* never block the click */
    }
  }

  const styles =
    variant === "small"
      ? "btn-clay text-white px-3.5 py-1.5 text-xs"
      : variant === "amber"
        ? "btn-soft px-4 py-2 text-sm"
        : "btn-clay text-white px-5 py-2.5 text-sm";

  return (
    <a
      href={buyUrl}
      target="_blank"
      rel="sponsored nofollow noopener"
      onClick={onClick}
      className={cn(styles, className)}
    >
      <ShoppingCart className="size-4" />
      {label}
    </a>
  );
}
