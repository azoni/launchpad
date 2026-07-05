"use client";

import { useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { CategorySlug } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/**
 * Product image tile. Shows a real photo when it loads; on any load error — or for
 * whole foods that have no product photo — it falls back to a clean illustrated tile
 * with the category's custom line icon (chicken, egg, beans, fish…), never a broken
 * image or a generic emoji.
 */
export function PlaceholderImage({
  category,
  imageUrl,
  alt,
  className,
}: {
  category: CategorySlug;
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
        showImg ? "bg-white" : "bg-[color:var(--color-leaf-soft)]",
        className,
      )}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={alt}
          onError={() => setFailed(true)}
          className="h-full w-full object-contain p-2"
          loading="lazy"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="flex h-full w-full items-center justify-center text-[color:var(--color-leaf-deep)]"
        >
          <CategoryIcon slug={category} className="h-1/2 w-1/2" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
