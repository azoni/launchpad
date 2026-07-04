"use client";

import { useState } from "react";
import { FORM_LABELS } from "@/lib/catalog/categories";
import type { ProteinForm } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const FORM_EMOJI: Record<ProteinForm, string> = {
  powder: "🥤",
  bar: "🍫",
  "rtd-shake": "🧴",
  "jerky-meat-snack": "🥩",
  "canned-seafood": "🐟",
  "yogurt-dairy": "🥛",
  "cereal-snack": "🥣",
  "nut-seed-butter": "🥜",
  "tofu-soy": "🧈",
  "whole-food": "🍗",
};

/**
 * Product image tile. Shows a real photo when it loads; on any load error it
 * falls back to a clean branded tile — so a dead image URL never looks broken.
 */
export function PlaceholderImage({
  form,
  imageUrl,
  alt,
  className,
}: {
  form: ProteinForm;
  imageUrl?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = !!imageUrl && !failed;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden",
        showImg ? "bg-white" : "bg-muted",
        className,
      )}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-1"
          loading="lazy"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground"
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            {FORM_EMOJI[form]}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            {FORM_LABELS[form]}
          </span>
        </div>
      )}
    </div>
  );
}
