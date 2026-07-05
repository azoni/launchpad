import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { CATEGORY_BY_SLUG } from "@/lib/catalog/categories";
import { formatCostPerGram, formatDose, formatPrice } from "@/lib/format";
import type { CatalogItem } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

type Source = "leaderboard" | "category" | "compare";

/** Photo-forward product card for the responsive discovery grid. */
export function ProductCard({
  item,
  rank,
  source = "leaderboard",
}: {
  item: CatalogItem;
  rank?: number;
  source?: Source;
}) {
  const m = item.metrics;
  return (
    <div className="price-tag-card is-interactive relative flex flex-col overflow-hidden">
      {/* whole-card tap target → product page (Buy button sits above via z-10) */}
      <Link
        href={`/food/${item.id}`}
        aria-label={item.name}
        className="absolute inset-0 z-0 rounded-[inherit]"
      />

      {/* Photo */}
      <div className="relative">
        <PlaceholderImage
          category={item.category}
          imageUrl={item.imageUrl}
          alt={item.imageAlt}
          className="aspect-square w-full border-b border-line"
        />
        {rank != null && (
          <span
            className={cn(
              "tabular absolute left-2 top-2 flex size-6 items-center justify-center rounded-full text-xs font-bold shadow-sm",
              rank <= 3
                ? "bg-primary text-primary-foreground"
                : "border border-line bg-white/95 text-ink",
            )}
          >
            {rank}
          </span>
        )}
        {item.savingsPercent ? (
          <span className="absolute right-2 top-2 rounded-full bg-[color:var(--color-gold)] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            {item.savingsPercent}% off
          </span>
        ) : !item.inStock ? (
          <span className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
            Out of stock
          </span>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink">
          {item.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {item.brand ? `${item.brand} · ` : ""}
          {CATEGORY_BY_SLUG[item.category].short}
        </p>

        <div className="mt-auto pt-2.5">
          <div className="flex items-baseline justify-between gap-1">
            <span className="tabular text-xl font-extrabold leading-none text-[color:var(--color-leaf-deep)]">
              {formatCostPerGram(m.costPerGramProteinCents)}
              <span className="text-xs font-normal text-muted-foreground">/g</span>
            </span>
            <span className="tabular text-[11px] text-muted-foreground">
              {formatDose(m.proteinDosePriceCents)}/20g
            </span>
          </div>
          <div className="tabular mt-1 text-xs text-muted-foreground">
            <span className="font-semibold text-ink">
              {formatPrice(item.effectivePriceCents)}
            </span>{" "}
            {item.priceIsEstimate ? "est." : "live"} · {item.proteinPerServing_g}g/serving
          </div>

          <div className="relative z-10 mt-2.5">
            <BuyButton
              slug={item.id}
              asin={item.asin}
              buyUrl={item.buyUrl}
              source={source}
              label="Buy"
              variant="small"
              className="w-full justify-center py-2"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
