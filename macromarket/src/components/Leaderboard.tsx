"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Search, X } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ProductCard } from "@/components/ProductCard";
import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  DIET_TAG_LABELS,
  SOURCES,
  categorySource,
  type SourceType,
} from "@/lib/catalog/categories";
import { costSortKey } from "@/lib/catalog/metrics";
import type { CatalogItem, CategorySlug, DietTag } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

type Sort = "cost" | "density" | "protein" | "price";

const SORTS: { value: Sort; label: string }[] = [
  { value: "cost", label: "Best value (per 10g protein)" },
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

const PAGE = 24;

interface State {
  sources: Record<SourceType, boolean>;
  category: CategorySlug | "all";
  diet: DietTag | "all";
  sort: Sort;
}

const DEFAULT: State = {
  sources: { amazon: true, whole: false },
  category: "all",
  diet: "all",
  sort: "cost",
};

export function Leaderboard({ items }: { items: CatalogItem[] }) {
  const [q, setQ] = useState("");
  const [s, setS] = useState<State>(DEFAULT);
  const [visible, setVisible] = useState(PAGE);

  // Reset pagination whenever the query or any filter changes.
  useEffect(() => setVisible(PAGE), [q, s]);

  const anySource = s.sources.amazon || s.sources.whole;
  const dirty =
    q !== "" ||
    s.category !== "all" ||
    s.diet !== "all" ||
    !s.sources.amazon ||
    s.sources.whole;

  const catStats = useMemo(() => {
    const m = new Map<CategorySlug, number>();
    for (const it of items) m.set(it.category, (m.get(it.category) ?? 0) + 1);
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    const list = items.filter((it) => {
      if (anySource && !s.sources[categorySource(it.category)]) return false;
      if (s.category !== "all" && it.category !== s.category) return false;
      if (s.diet !== "all" && !it.dietTags.includes(s.diet)) return false;
      if (
        query &&
        !`${it.name} ${it.brand ?? ""} ${it.category} ${it.form}`
          .toLowerCase()
          .includes(query)
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
  }, [items, q, s, anySource]);

  const shownCats = CATEGORIES.filter(
    (c) => !anySource || s.sources[categorySource(c.slug)],
  );
  const activeCat = s.category !== "all" ? CATEGORY_BY_SLUG[s.category] : null;
  const shown = filtered.slice(0, visible);

  const setCat = (category: CategorySlug | "all") =>
    setS((p) => ({ ...p, category }));

  function toggleSource(key: SourceType) {
    setS((p) => {
      const sources = { ...p.sources, [key]: !p.sources[key] };
      let category = p.category;
      const on = sources.amazon || sources.whole;
      if (category !== "all" && on && !sources[categorySource(category)])
        category = "all";
      return { ...p, sources, category };
    });
  }

  return (
    <div>
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${items.length} foods, brands, snacks…`}
          className="h-14 w-full rounded-xl border border-line-strong bg-white pl-12 pr-11 text-base font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search foods"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Source split — Amazon (packaged) vs Whole foods (groceries) */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Show
        </span>
        {SOURCES.map((src) => {
          const active = s.sources[src.key];
          return (
            <button
              key={src.key}
              onClick={() => toggleSource(src.key)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-line bg-white text-ink hover:bg-secondary",
              )}
            >
              {src.label}
            </button>
          );
        })}
      </div>

      {/* Compact browse-by-category chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setCat("all")}
          className={cn(
            "rounded-full px-3 py-2 text-xs font-bold transition-colors",
            s.category === "all"
              ? "bg-primary text-primary-foreground"
              : "border border-line bg-white text-ink hover:bg-secondary",
          )}
        >
          All categories
        </button>
        {shownCats.map((c) => {
          const active = s.category === c.slug;
          return (
            <button
              key={c.slug}
              onClick={() => setCat(active ? "all" : c.slug)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-secondary text-ink ring-1 ring-primary"
                  : "border-line bg-white text-ink hover:bg-secondary",
              )}
            >
              <CategoryIcon
                slug={c.slug}
                className="size-4 text-[color:var(--color-leaf-deep)]"
              />
              {c.short}
              <span className="tabular text-[10px] text-muted-foreground">
                {catStats.get(c.slug) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Diet chips */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Diet
        </span>
        {DIETS.map((d) => {
          const active = s.diet === d;
          return (
            <button
              key={d}
              onClick={() => setS((p) => ({ ...p, diet: active ? "all" : d }))}
              aria-pressed={active}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-line bg-white text-ink hover:bg-secondary",
              )}
            >
              {DIET_TAG_LABELS[d]}
            </button>
          );
        })}
      </div>

      {/* Results header */}
      <div className="mb-3 mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-ink">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "food" : "foods"}
          {activeCat && (
            <>
              {" in "}
              <span className="font-semibold text-ink">{activeCat.short}</span>
              {" · "}
              <Link
                href={`/category/${activeCat.slug}`}
                className="font-semibold text-primary hover:underline"
              >
                view page <ArrowRight className="inline size-3" />
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="sr-only">
            Sort by
          </label>
          <select
            id="sort"
            value={s.sort}
            onChange={(e) => setS({ ...s, sort: e.target.value as Sort })}
            className="h-10 rounded-md border border-line bg-white px-2.5 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          {dirty && (
            <button
              onClick={() => {
                setQ("");
                setS(DEFAULT);
              }}
              className="flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-muted-foreground hover:text-ink"
            >
              <RotateCcw className="size-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
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
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((it, i) => (
              <ProductCard key={it.id} item={it} rank={i + 1} source="leaderboard" />
            ))}
          </div>
          {filtered.length > visible && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="btn-soft px-6 py-2.5 text-sm"
              >
                Load more ({filtered.length - visible} left)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
