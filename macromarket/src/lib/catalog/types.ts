/**
 * MacroMarket catalog types.
 *
 * A seed item is static, human-curated, committed to git. It always carries a
 * baseline price (curated "as of" a date) so the site works even while the
 * live Amazon Creators API is unavailable. When live pricing IS available it
 * overrides the baseline automatically — see lib/catalog/pricing.ts.
 */

export type ProteinForm =
  | "powder"
  | "bar"
  | "rtd-shake"
  | "jerky-meat-snack"
  | "canned-seafood"
  | "yogurt-dairy"
  | "cereal-snack"
  | "nut-seed-butter"
  | "tofu-soy"
  | "whole-food";

export type DietTag =
  | "vegan"
  | "vegetarian"
  | "pescatarian"
  | "keto"
  | "low-carb"
  | "gluten-free"
  | "dairy-free"
  | "paleo"
  | "whole30";

export type CategorySlug =
  | "whey-protein"
  | "plant-protein"
  | "protein-bars"
  | "rtd-shakes"
  | "jerky-meat-snacks"
  | "canned-seafood"
  | "greek-yogurt-cottage-cheese"
  | "protein-cereal-snacks"
  | "nut-seed-butters"
  | "poultry-lean-meat"
  | "eggs-dairy"
  | "legumes-beans"
  | "tofu-tempeh-soy"
  | "seafood-whole";

/** Where the baseline price came from. Live Amazon data upgrades this at runtime. */
export type PriceSource =
  | "amazon-est" // curated estimate of an Amazon listing price
  | "grocery-est" // curated typical grocery price for a whole food
  | "usda-ers"; // USDA Economic Research Service national average

/** Static, curated, committed to git. */
export interface CatalogSeedItem {
  /** stable slug; used in URLs */
  id: string;
  name: string;
  brand: string | null;
  category: CategorySlug;
  form: ProteinForm;
  /** local (/img/...) or remote fallback image */
  imageUrl: string;
  imageAlt: string;

  /** Amazon ASIN — enables the buy link and live-price upgrade. null for pure whole foods. */
  asin: string | null;
  /** USDA FoodData Central id (nutrient #203 = protein) for provenance. */
  fdcId: number | null;

  servingSizeLabel: string; // "1 scoop (32 g)", "3 oz drained"
  servingSizeGrams: number | null;
  proteinPerServing_g: number;
  calories: number;
  /** 1 for single unit, 12 for a 12-pack case, etc. */
  packCount: number;
  /** pack-total servings (packCount-aware) */
  servingsPerContainer: number;

  dietTags: DietTag[];

  /** Baseline price in US cents. Always present. */
  priceCents: number;
  /** ISO-ish month the baseline price was captured, e.g. "2026-07". */
  priceAsOf: string;
  priceSource: PriceSource;

  /** 1–2 sentence editorial note; feeds GEO intro + JSON-LD description. */
  editorialBlurb: string;
}

/** Live-fetched pricing from the Amazon Creators API (ephemeral, cached). */
export interface LivePricing {
  priceCents: number | null;
  listPriceCents: number | null;
  savingsPercent: number | null;
  inStock: boolean;
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  fetchedAt: number; // epoch ms
}

export interface CatalogMetrics {
  totalProteinG: number;
  /** headline metric; null when no usable price */
  costPerGramProteinCents: number | null;
  /** shopper-friendly: cost of a 20 g "dose" of protein */
  proteinDosePriceCents: number | null;
  pricePerServingCents: number | null;
  /** g protein per 100 kcal — "leanness" */
  proteinDensity: number;
}

/** What pages render: seed + resolved live + derived metrics. */
export interface CatalogItem extends CatalogSeedItem {
  live: LivePricing | null;
  /** resolved price actually used (live if fresh, else baseline) */
  effectivePriceCents: number | null;
  priceIsLive: boolean;
  /** true when the resolved price is a curated estimate, not a live quote */
  priceIsEstimate: boolean;
  inStock: boolean;
  rating: number | null;
  reviewCount: number | null;
  savingsPercent: number | null;
  /**
   * True when a live price was fetched but rejected for being implausibly far from
   * the curated baseline (usually the resolved ASIN is a different pack size), so
   * the baseline is shown instead. Surfaced in the /stats review view.
   */
  priceSuspect: boolean;
  /** affiliate buy URL (tag=macromarket-20) */
  buyUrl: string;
  metrics: CatalogMetrics;
}
