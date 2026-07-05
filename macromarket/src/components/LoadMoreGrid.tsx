"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import type { CatalogItem } from "@/lib/catalog/types";

/** Paginated card grid for server-rendered lists (deals, etc.). */
export function LoadMoreGrid({
  items,
  initial = 24,
  step = 24,
}: {
  items: CatalogItem[];
  initial?: number;
  step?: number;
}) {
  const [visible, setVisible] = useState(initial);
  const shown = items.slice(0, visible);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((it, i) => (
          <ProductCard key={it.id} item={it} rank={i + 1} source="leaderboard" />
        ))}
      </div>
      {items.length > visible && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisible((v) => v + step)}
            className="btn-soft px-6 py-2.5 text-sm"
          >
            Load more ({items.length - visible} left)
          </button>
        </div>
      )}
    </>
  );
}
