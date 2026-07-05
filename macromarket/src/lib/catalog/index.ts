import { CATALOG } from "@/data/catalog";
import IMAGES from "@/data/images.json";
import VERIFIED_JSON from "@/data/verified.json";
import { affiliateSearchUrl, affiliateUrl } from "@/lib/amazon/asin";
import { computeMetrics, costSortKey } from "./metrics";
import { getLivePricing } from "./pricing";
import type {
  CatalogItem,
  CatalogSeedItem,
  CategorySlug,
  DietTag,
  LivePricing,
} from "./types";

export type { CatalogItem, CatalogSeedItem } from "./types";

const IMAGE_MAP = IMAGES as Record<string, string>;
const VERIFIED = VERIFIED_JSON as Record<string, { asin: string; image: string }>;

// A live price this far from the curated baseline is treated as a different pack
// size (which would corrupt $/g) rather than a real price change — reject + flag.
const PRICE_MIN_RATIO = 0.35;
const PRICE_MAX_RATIO = 2.6;

function buildItem(seed: CatalogSeedItem, live: LivePricing | null): CatalogItem {
  // Only VERIFIED ASINs are used — for a direct product link and a real Amazon
  // photo. Unverified candidate ASINs fall back to an affiliate search link.
  const verified = VERIFIED[seed.id];
  const asin = verified?.asin ?? null;

  const buyUrl = asin
    ? affiliateUrl(asin)
    : affiliateSearchUrl(`${seed.name} ${seed.brand ?? ""}`.trim());

  // Sanity-check the live price against the baseline; a wildly different value is
  // almost always a different pack size, so keep the baseline and flag it.
  let priceSuspect = false;
  let livePrice = live?.priceCents ?? null;
  if (livePrice != null && seed.priceCents > 0) {
    const ratio = livePrice / seed.priceCents;
    if (ratio < PRICE_MIN_RATIO || ratio > PRICE_MAX_RATIO) {
      livePrice = null;
      priceSuspect = true;
    }
  }

  const priceIsLive = livePrice != null;
  const effectivePriceCents = priceIsLive ? livePrice : seed.priceCents;

  // Image priority: live Amazon → verified Amazon photo → Open Food Facts → none.
  // (The live photo is still valid even when the live *price* was rejected.)
  const imageUrl =
    live?.imageUrl || verified?.image || IMAGE_MAP[seed.id] || seed.imageUrl;

  return {
    ...seed,
    asin,
    imageUrl,
    live,
    effectivePriceCents,
    priceIsLive,
    priceIsEstimate: !priceIsLive,
    priceSuspect,
    inStock: priceIsLive ? (live?.inStock ?? true) : true,
    rating: live?.rating ?? null,
    reviewCount: live?.reviewCount ?? null,
    savingsPercent: priceIsLive ? (live?.savingsPercent ?? null) : null,
    buyUrl,
    metrics: computeMetrics(seed, effectivePriceCents),
  };
}

/** The single validated ASIN for a slug (title-checked, in verified.json), or null. */
function validatedAsin(id: string): string | null {
  return VERIFIED[id]?.asin ?? null;
}

/**
 * Resolve seed items → CatalogItems, applying live pricing where available.
 *
 * Live pricing is keyed off the VALIDATED ASIN (verified.json), never the raw seed
 * ASIN — the seed ASINs were largely fabricated, so pricing on them would attach a
 * wrong product's price. Items without a validated ASIN keep their curated baseline.
 */
export async function resolveItems(
  seeds: CatalogSeedItem[],
): Promise<CatalogItem[]> {
  const asins = seeds
    .map((s) => validatedAsin(s.id))
    .filter((a): a is string => !!a);
  const live = await getLivePricing(asins);
  return seeds.map((s) => {
    const asin = validatedAsin(s.id);
    return buildItem(s, (asin && live.get(asin)) || null);
  });
}

/** Cheapest $/g first; no-price items sink to the bottom. */
export function sortByCost(items: CatalogItem[]): CatalogItem[] {
  return [...items].sort(
    (a, b) =>
      costSortKey(a.metrics.costPerGramProteinCents) -
      costSortKey(b.metrics.costPerGramProteinCents),
  );
}

export async function getAllItems(): Promise<CatalogItem[]> {
  return sortByCost(await resolveItems(CATALOG));
}

export async function getItemsByCategory(
  category: CategorySlug,
): Promise<CatalogItem[]> {
  return sortByCost(
    await resolveItems(CATALOG.filter((s) => s.category === category)),
  );
}

export async function getItemBySlug(slug: string): Promise<CatalogItem | null> {
  const seed = CATALOG.find((s) => s.id === slug);
  if (!seed) return null;
  const [item] = await resolveItems([seed]);
  return item ?? null;
}

/** Neighbors around an item on the $/g ladder (for the "compare to" section). */
export async function getNeighbors(
  slug: string,
  span = 3,
): Promise<CatalogItem[]> {
  const all = await getAllItems();
  const idx = all.findIndex((i) => i.id === slug);
  if (idx === -1) return [];
  return all
    .slice(Math.max(0, idx - span), idx + span + 1)
    .filter((i) => i.id !== slug);
}

export function allSlugs(): string[] {
  return CATALOG.map((s) => s.id);
}

/**
 * Deals view: real Amazon sale items (when live pricing is on) plus the
 * best-value pick in every category (the "best deal in each aisle").
 */
export async function getDeals(): Promise<{
  onSale: CatalogItem[];
  bestValue: CatalogItem[];
  hasLiveDeals: boolean;
}> {
  const all = await getAllItems(); // sorted cheapest $/g first
  const onSale = all
    .filter((i) => (i.savingsPercent ?? 0) > 0 && i.inStock)
    .sort((a, b) => (b.savingsPercent ?? 0) - (a.savingsPercent ?? 0));

  const seen = new Set<string>();
  const bestValue: CatalogItem[] = [];
  for (const it of all) {
    if (it.metrics.costPerGramProteinCents == null) continue;
    if (!seen.has(it.category)) {
      seen.add(it.category);
      bestValue.push(it);
    }
  }
  return { onSale, bestValue, hasLiveDeals: onSale.length > 0 };
}

export function seedBySlug(slug: string): CatalogSeedItem | undefined {
  return CATALOG.find((s) => s.id === slug);
}

/** Server-side catalog search used by the AI coach's `search_catalog` tool. */
export async function searchCatalog(opts: {
  query?: string;
  dietTag?: DietTag;
  category?: CategorySlug;
  maxCostPerGramCents?: number;
  limit?: number;
}): Promise<CatalogItem[]> {
  let items = await getAllItems();
  const q = opts.query?.toLowerCase().trim();
  if (q) {
    items = items.filter((i) =>
      `${i.name} ${i.brand ?? ""} ${i.category} ${i.form} ${i.editorialBlurb}`
        .toLowerCase()
        .includes(q),
    );
  }
  if (opts.dietTag) items = items.filter((i) => i.dietTags.includes(opts.dietTag!));
  if (opts.category) items = items.filter((i) => i.category === opts.category);
  if (opts.maxCostPerGramCents != null) {
    items = items.filter(
      (i) =>
        i.metrics.costPerGramProteinCents != null &&
        i.metrics.costPerGramProteinCents <= opts.maxCostPerGramCents!,
    );
  }
  return items.slice(0, opts.limit ?? 5);
}
