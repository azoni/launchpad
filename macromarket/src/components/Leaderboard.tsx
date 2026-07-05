"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw, Search, X } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ProductCard } from "@/components/ProductCard";
import {
  CATEGORIES,
  CATEGORY_BY_SLUG,
  CATEGORY_GROUPS,
  DIET_TAG_LABELS,
} from "@/lib/catalog/categories";
import { costSortKey } from "@/lib/catalog/metrics";
import { formatCostPerGram } from "@/lib/format";
import type { CatalogItem, CategorySlug, DietTag } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

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
  sort: Sort;
}

const DEFAULT: State = { category: "all", diet: "all", sort: "cost" };

export function Leaderboard({ items }: { items: CatalogItem[] }) {
  const [q, setQ] = useState("");
  const [s, setS] = useState<State>(DEFAULT);

  const dirty = q !== "" || s.category !== "all" || s.diet !== "all";

  const catStats = useMemo(() => {
    const m = new Map<CategorySlug, { count: number; best: number | null }>();
    for (const it of items) {
      const cur = m.get(it.category) ?? { count: 0, best: null };
      cur.count += 1;
      const c = it.metrics.costPerGramProteinCents;
      if (c != null && (cur.best == null || c < cur.best)) cur.best = c;
      m.set(it.category, cur);
    }
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    const list = items.filter((it) => {
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
  }, [items, q, s]);

  const activeCat = s.category !== "all" ? CATEGORY_BY_SLUG[s.category] : null;
  const setCat = (category: CategorySlug | "all") =>
    setS((p) => ({ ...p, category }));

  return (
    <div>
      {/* Search — big and obvious */}
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

      {/* Browse by category — icons + counts, everything visible & tappable */}
      <section className="mt-4 rounded-xl border border-line bg-white p-3 sm:p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-heading text-base font-bold text-ink">
            Browse by category
          </h2>
          <button
            onClick={() => setCat("all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
              s.category === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-line bg-white text-ink hover:bg-secondary",
            )}
          >
            All {items.length}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {CATEGORY_GROUPS.map((g) => (
            <div key={g.key}>
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                {g.label}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {CATEGORIES.filter((c) => c.group === g.key).map((c) => {
                  const st = catStats.get(c.slug);
                  const active = s.category === c.slug;
                  return (
                    <button
                      key={c.slug}
                      onClick={() => setCat(active ? "all" : c.slug)}
                      aria-pressed={active}
                      className={cn(
                        "flex min-h-14 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all",
                        active
                          ? "border-primary bg-secondary ring-1 ring-primary"
                          : "border-line bg-white hover:-translate-y-0.5 hover:border-line-strong hover:shadow-sm",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-[color:var(--color-leaf-deep)]",
                        )}
                      >
                        <CategoryIcon slug={c.slug} className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">
                          {c.short}
                        </span>
                        <span className="tabular block text-[11px] text-muted-foreground">
                          {st?.count ?? 0}
                          {st?.best != null && (
                            <>
                              {" · "}
                              <span className="font-semibold text-[color:var(--color-leaf-deep)]">
                                {formatCostPerGram(st.best)}/g
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Diet filter chips — bigger tap targets */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
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
                "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
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

      {/* Results grid — photo-forward cards */}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((it, i) => (
            <ProductCard key={it.id} item={it} rank={i + 1} source="leaderboard" />
          ))}
        </div>
      )}
    </div>
  );
}
