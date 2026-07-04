"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { DIET_TAG_LABELS } from "@/lib/catalog/categories";
import { formatCostPerGram, formatPrice } from "@/lib/format";
import type { CatalogItem, DietTag } from "@/lib/catalog/types";

const INTENSITIES: { key: string; label: string; perLb: number; hint: string }[] = [
  { key: "maintain", label: "Maintain", perLb: 0.5, hint: "general health" },
  { key: "active", label: "Active", perLb: 0.8, hint: "regular training" },
  { key: "build", label: "Build muscle", perLb: 1.0, hint: "hard cutting / bulking" },
];

const DIETS: (DietTag | "all")[] = [
  "all",
  "vegan",
  "vegetarian",
  "pescatarian",
  "keto",
  "gluten-free",
  "dairy-free",
];

const selectClass =
  "h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ring";

function servings(item: CatalogItem, grams: number): number {
  return Math.max(1, Math.round(grams / item.proteinPerServing_g));
}
function costCents(item: CatalogItem, grams: number): number {
  return grams * (item.metrics.costPerGramProteinCents ?? 0);
}

export function ProteinCalculator({ items }: { items: CatalogItem[] }) {
  const [weight, setWeight] = useState(170);
  const [unit, setUnit] = useState<"lb" | "kg">("lb");
  const [intensity, setIntensity] = useState("active");
  const [diet, setDiet] = useState<DietTag | "all">("all");

  const target = useMemo(() => {
    const lb = unit === "kg" ? weight * 2.20462 : weight;
    const perLb = INTENSITIES.find((i) => i.key === intensity)!.perLb;
    return Math.round(lb * perLb);
  }, [weight, unit, intensity]);

  const eligible = useMemo(() => {
    return items
      .filter(
        (i) =>
          i.inStock &&
          i.metrics.costPerGramProteinCents != null &&
          (diet === "all" || i.dietTags.includes(diet)),
      )
      .sort(
        (a, b) =>
          (a.metrics.costPerGramProteinCents ?? 0) -
          (b.metrics.costPerGramProteinCents ?? 0),
      );
  }, [items, diet]);

  const cheapest = eligible[0];
  const basket = eligible.slice(0, 3);
  const perItemGrams = target / (basket.length || 1);

  return (
    <div>
      {/* Inputs */}
      <div className="rounded-xl border border-line bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-ink">Body weight</label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                min={60}
                max={500}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) || 0)}
                className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as "lb" | "kg")}
                className={selectClass}
                aria-label="Weight unit"
              >
                <option value="lb">lb</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Goal</label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className={`${selectClass} mt-1 w-full`}
              aria-label="Goal"
            >
              {INTENSITIES.map((i) => (
                <option key={i.key} value={i.key}>
                  {i.label} — {i.perLb} g/lb ({i.hint})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-ink">Diet</label>
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value as DietTag | "all")}
              className={`${selectClass} mt-1 w-full`}
              aria-label="Diet"
            >
              {DIETS.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? "No restriction" : DIET_TAG_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <div className="rounded-lg border border-line bg-secondary p-3 text-center">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Daily protein target
              </div>
              <div className="tabular text-3xl font-extrabold text-primary">
                {target} g
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Target uses {INTENSITIES.find((i) => i.key === intensity)!.perLb} g of
          protein per pound of body weight. General guidance for active adults —
          not medical advice.
        </p>
      </div>

      {/* Cheapest single source */}
      {cheapest && (
        <div className="mt-6">
          <h2 className="mb-2 font-heading text-xl font-bold text-ink">
            Cheapest way to hit {target} g/day
          </h2>
          <div className="price-tag-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/food/${cheapest.id}`}
                className="font-heading text-lg font-bold text-ink hover:text-primary"
              >
                {cheapest.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                ~{servings(cheapest, target)} servings/day ·{" "}
                <span className="tabular font-semibold text-ink">
                  {formatCostPerGram(cheapest.metrics.costPerGramProteinCents)}/g
                </span>
              </p>
            </div>
            <div className="text-right">
              <div className="tabular text-2xl font-bold text-primary">
                {formatPrice(costCents(cheapest, target))}
                <span className="text-sm text-muted-foreground">/day</span>
              </div>
              <div className="text-xs text-muted-foreground">
                ≈ {formatPrice(costCents(cheapest, target) * 30)}/month
              </div>
            </div>
            <BuyButton
              slug={cheapest.id}
              asin={cheapest.asin}
              buyUrl={cheapest.buyUrl}
              source="calculator"
              label="Buy"
              variant="small"
            />
          </div>
        </div>
      )}

      {/* Balanced basket */}
      {basket.length > 1 && (
        <div className="mt-6">
          <h2 className="mb-2 font-heading text-xl font-bold text-ink">
            Or a balanced basket
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Split your {target} g across the three best-value{" "}
            {diet === "all" ? "" : `${DIET_TAG_LABELS[diet]} `}options:
          </p>
          <div className="flex flex-col gap-3">
            {basket.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/food/${it.id}`}
                    className="truncate font-semibold text-ink hover:text-primary"
                  >
                    {it.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    ~{servings(it, perItemGrams)} servings ·{" "}
                    {Math.round(perItemGrams)} g protein/day
                  </p>
                </div>
                <div className="tabular whitespace-nowrap text-sm font-bold text-ink">
                  {formatPrice(costCents(it, perItemGrams))}/day
                </div>
                <BuyButton
                  slug={it.id}
                  asin={it.asin}
                  buyUrl={it.buyUrl}
                  source="calculator"
                  label="Buy"
                  variant="small"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
