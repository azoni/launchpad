/**
 * The MacroMarket Protein Price Index.
 *
 * Original data nobody else publishes: the median cost per gram of protein across
 * our whole catalog, broken out by category, plus the cheapest pick in each. This
 * is the "linkable asset" — bloggers, journalists, and AI answers cite numbers,
 * and this page is a stable URL of numbers about protein value.
 */
import type { CatalogItem, CategorySlug } from "./types";

export interface CategoryIndexRow {
  category: CategorySlug;
  count: number;
  medianCentsPerGram: number;
  cheapestCentsPerGram: number;
  cheapest: { id: string; name: string };
}

export interface PriceIndex {
  generatedAt: string;
  totalItems: number;
  pricedItems: number;
  medianCentsPerGram: number;
  cheapest: CategoryIndexRow[];
  /** cheapest single items overall */
  topValue: { id: string; name: string; category: CategorySlug; centsPerGram: number }[];
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function buildPriceIndex(items: CatalogItem[]): PriceIndex {
  const priced = items.filter(
    (i): i is CatalogItem & { metrics: { costPerGramProteinCents: number } } =>
      i.metrics.costPerGramProteinCents != null,
  );

  const byCat = new Map<CategorySlug, CatalogItem[]>();
  for (const i of priced) {
    const arr = byCat.get(i.category) ?? [];
    arr.push(i);
    byCat.set(i.category, arr);
  }

  const rows: CategoryIndexRow[] = [];
  for (const [category, list] of byCat) {
    const cpgs = list.map((i) => i.metrics.costPerGramProteinCents!);
    const cheapest = list.reduce((best, i) =>
      i.metrics.costPerGramProteinCents! < best.metrics.costPerGramProteinCents!
        ? i
        : best,
    );
    rows.push({
      category,
      count: list.length,
      medianCentsPerGram: +median(cpgs).toFixed(2),
      cheapestCentsPerGram: +cheapest.metrics.costPerGramProteinCents!.toFixed(2),
      cheapest: { id: cheapest.id, name: cheapest.name },
    });
  }
  rows.sort((a, b) => a.medianCentsPerGram - b.medianCentsPerGram);

  const topValue = [...priced]
    .sort(
      (a, b) =>
        a.metrics.costPerGramProteinCents! - b.metrics.costPerGramProteinCents!,
    )
    .slice(0, 15)
    .map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      centsPerGram: +i.metrics.costPerGramProteinCents!.toFixed(2),
    }));

  return {
    generatedAt: new Date().toISOString(),
    totalItems: items.length,
    pricedItems: priced.length,
    medianCentsPerGram: +median(
      priced.map((i) => i.metrics.costPerGramProteinCents!),
    ).toFixed(2),
    cheapest: rows,
    topValue,
  };
}
