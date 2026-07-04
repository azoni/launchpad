"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { ProductRow } from "@/components/ProductRow";
import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  DIET_TAG_LABELS,
} from "@/lib/catalog/categories";
import { costSortKey } from "@/lib/catalog/metrics";
import type { CatalogItem, CategorySlug, DietTag } from "@/lib/catalog/types";

type Sort = "cost" | "density" | "protein" | "price";

const SORTS: { value: Sort; label: string }[] = [
  { value: "cost", label: "Best value ($/g protein)" },
  { value: "density", label: "Most protein per calorie" },
  { value: "protein", label: "Most protein per serving" },
  { value: "price", label: "Lowest sticker price" },
];

const DIETS: DietTag[] = [
  "vegan",
  "vegetarian",
  "pescatarian",
  "keto",
  "low-carb",
  "gluten-free",
  "dairy-free",
  "paleo",
  "whole30",
];

interface State {
  category: CategorySlug | "all";
  diet: DietTag | "all";
  includeWhole: boolean;
  sort: Sort;
}

const DEFAULT: State = {
  category: "all",
  diet: "all",
  includeWhole: true,
  sort: "cost",
};

const PRESETS: { label: string; state: Partial<State> }[] = [
  { label: "🏆 Best value", state: { ...DEFAULT } },
  { label: "Whey powder", state: { category: "whey-protein" } },
  { label: "Protein bars", state: { category: "protein-bars" } },
  { label: "Vegan", state: { diet: "vegan" } },
  { label: "Keto", state: { diet: "keto" } },
  { label: "Supplements only", state: { includeWhole: false } },
];

const selectClass =
  "h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ring";

export function Leaderboard({ items }: { items: CatalogItem[] }) {
  const [q, setQ] = useState("");
  const [s, setS] = useState<State>(DEFAULT);

  const dirty =
    q !== "" ||
    s.category !== "all" ||
    s.diet !== "all" ||
    !s.includeWhole ||
    s.sort !== "cost";

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    const list = items.filter((it) => {
      if (s.category !== "all" && it.category !== s.category) return false;
      if (s.diet !== "all" && !it.dietTags.includes(s.diet)) return false;
      if (!s.includeWhole && CATEGORY_BY_SLUG[it.category].group === "whole")
        return false;
      if (
        query &&
        !`${it.name} ${it.brand ?? ""} ${it.category}`.toLowerCase().includes(query)
      )
        return false;
      return true;
    });

    return list.sort((a, b) => {
      switch (s.sort) {
        case "density":
          return b.metrics.proteinDensity - a.metrics.proteinDensity;
        case "protein":
          return b.proteinPerServing_g - a.proteinPerServing_g;
        case "price":
          return (
            costSortKey(a.effectivePriceCents) - costSortKey(b.effectivePriceCents)
          );
        default:
          return (
            costSortKey(a.metrics.costPerGramProteinCents) -
            costSortKey(b.metrics.costPerGramProteinCents)
          );
      }
    });
  }, [items, q, s]);

  return (
    <div>
      {/* Quick views */}
      <div className="mb-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setQ("");
              setS({ ...DEFAULT, ...p.state });
            }}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-accent"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="rounded-xl border border-line bg-white p-3">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${items.length} foods and brands…`}
            className="h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search foods"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={s.category}
            onChange={(e) => setS({ ...s, category: e.target.value as CategorySlug | "all" })}
            className={selectClass}
            aria-label="Category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={s.diet}
            onChange={(e) => setS({ ...s, diet: e.target.value as DietTag | "all" })}
            className={selectClass}
            aria-label="Diet"
          >
            <option value="all">Any diet</option>
            {DIETS.map((d) => (
              <option key={d} value={d}>
                {DIET_TAG_LABELS[d]}
              </option>
            ))}
          </select>
          <select
            value={s.sort}
            onChange={(e) => setS({ ...s, sort: e.target.value as Sort })}
            className={selectClass}
            aria-label="Sort by"
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={s.includeWhole}
              onChange={(e) => setS({ ...s, includeWhole: e.target.checked })}
              className="size-4 accent-[color:var(--color-leaf)]"
            />
            Whole foods
          </label>
          {dirty && (
            <button
              onClick={() => {
                setQ("");
                setS(DEFAULT);
              }}
              className="flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold text-muted-foreground hover:text-ink"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Result count + legend */}
      <div className="mb-2 mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-ink">{filtered.length}</span> foods ·{" "}
          {SORTS.find((o) => o.value === s.sort)?.label.toLowerCase()}
        </span>
        <span className="tabular text-xs">
          green figure = cost per gram of protein
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((it, i) => (
          <ProductRow key={it.id} item={it} rank={i + 1} source="leaderboard" />
        ))}
        {filtered.length === 0 && (
          <p className="rounded-md border border-dashed border-line p-8 text-center text-muted-foreground">
            No foods match those filters.{" "}
            <button
              onClick={() => {
                setQ("");
                setS(DEFAULT);
              }}
              className="font-semibold text-primary"
            >
              Reset filters
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
