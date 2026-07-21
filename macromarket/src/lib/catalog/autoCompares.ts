/**
 * Programmatic comparison pairs for /compare/[slug].
 *
 * SEO play: "X vs Y" searches are high-intent and low-competition. We generate a
 * large, DETERMINISTIC set of value rivalries from the seed catalog so the page
 * set is stable across builds (no Date.now/random — required for static export):
 *
 *  1. Within each category, order items by baseline $/g and pair adjacent rungs
 *     on the value ladder — the "is A or B the better deal" comparison shoppers
 *     actually type.
 *  2. A curated set of cross-source marquee pairs (supplement vs whole food).
 *
 * Merged with the hand-curated COMPARE_PAIRS and de-duplicated by unordered key.
 */
import { CATALOG } from "@/data/catalog";
import { computeMetrics } from "./metrics";
import { COMPARE_PAIRS } from "./compares";
import type { CatalogSeedItem, CategorySlug } from "./types";

type Pair = [string, string];

const MAX_PAIRS_PER_CATEGORY = 6;

/** Baseline $/g from seed data — stable across builds (no live price). */
function baselineCentsPerGram(s: CatalogSeedItem): number | null {
  return computeMetrics(s, s.priceCents).costPerGramProteinCents;
}

/** Unordered key so (a,b) and (b,a) collapse to one. */
function key(a: string, b: string): string {
  return [a, b].sort().join("::");
}

function withinCategoryPairs(): Pair[] {
  const byCat = new Map<CategorySlug, CatalogSeedItem[]>();
  for (const s of CATALOG) {
    if (baselineCentsPerGram(s) == null) continue;
    const arr = byCat.get(s.category) ?? [];
    arr.push(s);
    byCat.set(s.category, arr);
  }

  const pairs: Pair[] = [];
  for (const items of byCat.values()) {
    // Ascending value ladder; tie-break by id so the order is fully deterministic.
    const ladder = [...items].sort((a, b) => {
      const ca = baselineCentsPerGram(a)!;
      const cb = baselineCentsPerGram(b)!;
      return ca - cb || a.id.localeCompare(b.id);
    });
    // Adjacent rungs = closest value rivals; cap per category.
    let made = 0;
    for (let i = 0; i + 1 < ladder.length && made < MAX_PAIRS_PER_CATEGORY; i++) {
      pairs.push([ladder[i].id, ladder[i + 1].id]);
      made++;
    }
  }
  return pairs;
}

/**
 * Marquee cross-source pairs (supplement/snack vs whole food). Only kept if both
 * slugs exist in the catalog, so this never generates a 404.
 */
const CROSS_SOURCE_PAIRS: Pair[] = [
  ["optimum-nutrition-gold-standard-whey", "chicken-breast-boneless-skinless"],
  ["quest-protein-bars-chocolate-chip", "large-eggs-dozen"],
  ["premier-protein-shake-12pack", "milk-2-percent-gallon"],
  ["fage-total-0-greek-yogurt-32oz", "jif-peanut-butter-creamy-40oz"],
  ["orgain-organic-plant-protein", "red-lentils-dry-2lb"],
  ["jack-links-beef-jerky-original", "canned-black-beans-8pack"],
  ["chicken-of-the-sea-chunk-light-tuna-12can", "extra-firm-tofu-16oz"],
  ["magic-spoon-protein-cereal", "large-eggs-dozen"],
  ["fairlife-nutrition-plan-30g-12pack", "rotisserie-chicken-whole"],
  ["banza-chickpea-pasta-variety-6pack", "black-beans-dry-2lb"],
];

let cached: Pair[] | null = null;

/** All comparison pairs (curated + cross-source + within-category), de-duped. */
export function allComparePairs(): Pair[] {
  if (cached) return cached;
  const valid = new Set(CATALOG.map((s) => s.id));
  const seen = new Set<string>();
  const out: Pair[] = [];

  const add = (a: string, b: string) => {
    if (a === b || !valid.has(a) || !valid.has(b)) return;
    const k = key(a, b);
    if (seen.has(k)) return;
    seen.add(k);
    out.push([a, b]);
  };

  // Priority order: hand-curated first (nicest verdicts), then cross-source, then
  // the long-tail within-category set.
  for (const [a, b] of COMPARE_PAIRS) add(a, b);
  for (const [a, b] of CROSS_SOURCE_PAIRS) add(a, b);
  for (const [a, b] of withinCategoryPairs()) add(a, b);

  cached = out;
  return out;
}

export function compareSlugFor([a, b]: Pair): string {
  return `${a}-vs-${b}`;
}
