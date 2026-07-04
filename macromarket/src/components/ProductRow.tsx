import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BuyButton } from "@/components/BuyButton";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import {
  CATEGORY_BY_SLUG,
  DIET_TAG_LABELS,
  FORM_LABELS,
} from "@/lib/catalog/categories";
import { formatCostPerGram, formatDose, formatPrice } from "@/lib/format";
import type { CatalogItem } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

type Source = "leaderboard" | "category" | "compare";

export function ProductRow({
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
    <div className="price-tag-card is-interactive relative flex items-center gap-3 p-2.5 pr-3">
      {/* whole-card click target → product page (Buy button sits above via z-10) */}
      <Link
        href={`/food/${item.id}`}
        aria-label={item.name}
        className="absolute inset-0 z-0 rounded-[inherit]"
      />

      {rank != null && (
        <span
          className={cn(
            "tabular flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            rank <= 3
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-[color:var(--color-leaf-deep)]",
          )}
        >
          {rank}
        </span>
      )}

      <PlaceholderImage
        form={item.form}
        imageUrl={item.imageUrl}
        alt={item.imageAlt}
        className="size-12 shrink-0 rounded-md border border-line"
      />

      {/* identity */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold leading-tight text-ink">
          {item.name}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {item.brand ? `${item.brand} · ` : ""}
          {CATEGORY_BY_SLUG[item.category].short} · {item.proteinPerServing_g}g/serving
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {item.dietTags.slice(0, 2).map((d) => (
            <Badge key={d} variant="secondary">
              {DIET_TAG_LABELS[d]}
            </Badge>
          ))}
          <Badge variant="muted">{FORM_LABELS[item.form]}</Badge>
          {!item.inStock && <Badge variant="alert">Out of stock</Badge>}
          {item.savingsPercent ? (
            <Badge variant="amber">{item.savingsPercent}% off</Badge>
          ) : null}
        </div>
      </div>

      {/* metric */}
      <div className="shrink-0 text-right">
        <div className="tabular text-xl font-semibold leading-none text-[color:var(--color-leaf-deep)]">
          {formatCostPerGram(m.costPerGramProteinCents)}
          <span className="text-xs font-normal text-muted-foreground"> /g</span>
        </div>
        <div className="tabular mt-1 text-[11px] text-muted-foreground">
          <span className="font-semibold text-ink">
            {formatPrice(item.effectivePriceCents)}
          </span>{" "}
          {item.priceIsEstimate ? "est." : "live"} · {formatDose(m.proteinDosePriceCents)}/20g
        </div>
      </div>

      <div className="relative z-10 shrink-0">
        <BuyButton
          slug={item.id}
          asin={item.asin}
          buyUrl={item.buyUrl}
          source={source}
          label="Buy"
          variant="small"
        />
      </div>
    </div>
  );
}
