/**
 * "Best of" landing pages (/best/[slug]).
 *
 * SEO play: these target the exact head/mid queries a niche site can win
 * ("best cheap protein powder", "high protein low calorie snacks", "cheapest
 * vegan protein") with curated, data-backed ItemLists + FAQ schema. Each
 * collection is a pure predicate over the resolved catalog plus editorial copy;
 * ranking is always by our signature value metric (cost per gram of protein).
 */
import type { CatalogItem, CategorySlug, DietTag } from "./types";

export interface Collection {
  slug: string;
  /** H1 / page title */
  title: string;
  /** <150 char meta description */
  description: string;
  /** intro paragraph (first ~200 words matter most for GEO) */
  intro: string;
  /** how many items to show */
  limit: number;
  /** filter predicate over resolved catalog items */
  filter: (i: CatalogItem) => boolean;
  /** page-specific Q&A (feeds FAQPage JSON-LD + on-page FAQ) */
  faqs: { q: string; a: string }[];
}

const hasValue = (i: CatalogItem) => i.metrics.costPerGramProteinCents != null;
const diet = (tag: DietTag) => (i: CatalogItem) =>
  hasValue(i) && i.dietTags.includes(tag);
const cat = (...c: CategorySlug[]) => {
  const set = new Set(c);
  return (i: CatalogItem) => hasValue(i) && set.has(i.category);
};

export const COLLECTIONS: Collection[] = [
  {
    slug: "cheapest-protein-powder",
    title: "Cheapest Protein Powder by the Gram",
    description:
      "The best-value protein powders ranked by cost per gram of protein — whey, casein, and plant powders that stretch your money furthest.",
    intro:
      "Protein powder is usually the cheapest supplemental protein you can buy, but the price per gram varies wildly between brands and tub sizes. We ranked every whey, casein, and plant powder in our catalog by cost per 10 g of protein so you can see which tubs are genuinely cheap and which just look cheap on the shelf. Bigger tubs almost always win on price per gram, and unflavored isolates often beat name-brand flavored powders.",
    limit: 20,
    filter: cat("whey-protein", "plant-protein"),
    faqs: [
      {
        q: "What is the cheapest protein powder per gram of protein?",
        a: "The cheapest protein powders per gram are typically large tubs of whey concentrate and unflavored isolates. We rank them live by cost per 10 g of protein at the top of this page.",
      },
      {
        q: "Is whey or plant protein cheaper?",
        a: "Whey is usually cheaper per gram of protein than plant protein, but budget pea and soy powders can come close. This page mixes both so you can compare directly.",
      },
    ],
  },
  {
    slug: "cheapest-vegan-protein",
    title: "Cheapest Vegan Protein Sources",
    description:
      "The best-value vegan protein — plant powders, tofu, tempeh, beans, and lentils ranked by cost per gram of protein.",
    intro:
      "Vegan protein has a reputation for being expensive, but that's only true if you stop at powders. Dry lentils, beans, and tofu are some of the cheapest protein per gram of anything in the grocery store, plant or animal. This page ranks every vegan-friendly pick in our catalog — powders, tofu, tempeh, edamame, beans, and lentils — by cost per 10 g of protein, so you can build a high-protein plant-based diet without overpaying.",
    limit: 24,
    filter: diet("vegan"),
    faqs: [
      {
        q: "What is the cheapest vegan protein?",
        a: "Dry lentils and beans are the cheapest vegan protein per gram, often under 2 cents per gram. Tofu and pea protein powder are the next cheapest. This page ranks them all live.",
      },
      {
        q: "Can you get enough protein on a budget vegan diet?",
        a: "Yes. Lentils, beans, tofu, tempeh, and soy or pea protein powder deliver plenty of protein for very little money. Combining a few sources also covers all essential amino acids.",
      },
    ],
  },
  {
    slug: "cheapest-protein-bars",
    title: "Best-Value Protein Bars",
    description:
      "Protein bars ranked by cost per gram of protein — which bars actually give you the most protein for your money.",
    intro:
      "Protein bars are convenient but you pay a steep premium per gram versus powder or whole foods. Within the bar aisle, though, value still varies a lot: some bars cost twice as much per gram of protein as others with similar macros. This page ranks every protein bar in our catalog by cost per 10 g of protein so you can grab the ones that are actually worth it.",
    limit: 20,
    filter: cat("protein-bars"),
    faqs: [
      {
        q: "What is the best value protein bar?",
        a: "The best-value protein bars deliver the most protein per dollar. Multipacks and warehouse-club bars usually win; we rank them live by cost per 10 g of protein.",
      },
      {
        q: "Are protein bars a good value?",
        a: "Protein bars cost more per gram of protein than powder or whole foods, so they're best for convenience rather than value. If you buy them, the cheaper-per-gram picks on this page get you the most protein for the money.",
      },
    ],
  },
  {
    slug: "high-protein-low-calorie",
    title: "Highest-Protein, Lowest-Calorie Foods",
    description:
      "The leanest high-protein foods — ranked by protein per calorie so you get maximum protein for minimum calories.",
    intro:
      "When you're cutting calories, protein density matters more than price: you want the most protein for the fewest calories. This page ranks our catalog by grams of protein per 100 calories, surfacing the leanest picks — think canned tuna, egg whites, nonfat Greek yogurt, and isolate powders — that keep you full and hitting your protein target without blowing your calorie budget.",
    limit: 24,
    filter: (i) => hasValue(i) && i.metrics.proteinDensity >= 12,
    faqs: [
      {
        q: "What food has the most protein per calorie?",
        a: "Very lean foods like canned tuna, egg whites, nonfat Greek yogurt, white fish, and whey isolate have the most protein per calorie. This page ranks them by grams of protein per 100 calories.",
      },
      {
        q: "Why does protein per calorie matter?",
        a: "If you're losing weight, protein-dense foods let you hit your protein target while staying in a calorie deficit, which protects muscle and keeps you full.",
      },
    ],
  },
  {
    slug: "cheapest-protein-overall",
    title: "Cheapest Protein Sources, Period",
    description:
      "The absolute cheapest protein per gram across every category — whole foods and supplements ranked head to head.",
    intro:
      "This is the master value list: every food and supplement in our catalog, ranked by cost per gram of protein with no category filter. Whole foods almost always win — dry beans, lentils, eggs, milk, and canned fish routinely beat powders and bars per gram — but the ranking updates with live prices, so deals can shuffle the order. If you only care about one thing, protein for the least money, start here.",
    limit: 30,
    filter: hasValue,
    faqs: [
      {
        q: "What is the cheapest source of protein?",
        a: "Dry beans and lentils are the cheapest protein per gram, followed by eggs, milk, and canned fish. Whole foods generally beat supplements. This page ranks everything live by cost per 10 g of protein.",
      },
      {
        q: "Is it cheaper to get protein from food or powder?",
        a: "Whole foods like eggs, beans, and canned tuna are usually cheaper per gram of protein than powder, though large tubs of whey come close. This page compares both directly.",
      },
    ],
  },
  {
    slug: "keto-protein-snacks",
    title: "Best Keto & Low-Carb Protein Snacks",
    description:
      "Keto-friendly high-protein snacks ranked by value — jerky, cheese, pork rinds, and low-carb bars by cost per gram of protein.",
    intro:
      "On keto or low-carb, your protein has to come with very few carbs — which rules out beans and most bars. This page ranks the keto- and low-carb-tagged picks in our catalog by cost per 10 g of protein: jerky and meat sticks, cheese, canned fish, and the genuinely low-carb bars and shakes. Great macros usually cost more per gram, so value matters here.",
    limit: 20,
    filter: (i) =>
      hasValue(i) && (i.dietTags.includes("keto") || i.dietTags.includes("low-carb")),
    faqs: [
      {
        q: "What are the best high-protein keto snacks?",
        a: "Beef jerky and meat sticks, cheese, canned fish, and low-carb protein bars are the best high-protein keto snacks. This page ranks them by cost per gram of protein.",
      },
      {
        q: "Which protein snacks are lowest in carbs?",
        a: "Plain jerky, cheese, canned tuna and salmon, and pork rinds are essentially zero-carb. Look for the keto and low-carb tags on this page.",
      },
    ],
  },
  {
    slug: "cheapest-protein-shakes",
    title: "Best-Value Ready-to-Drink Protein Shakes",
    description:
      "Ready-to-drink protein shakes ranked by cost per gram of protein — which grab-and-go shakes give you the most protein per dollar.",
    intro:
      "Ready-to-drink shakes are the ultimate convenience: no blender, no cleanup, 20-42 g of protein in a bottle. You pay for that convenience, so within the category value varies a lot. This page ranks every RTD shake in our catalog by cost per 10 g of protein — multipacks and warehouse-club cases usually deliver the best price per gram.",
    limit: 20,
    filter: cat("rtd-shakes"),
    faqs: [
      {
        q: "What is the best value protein shake?",
        a: "The best-value ready-to-drink shakes deliver the most protein per dollar, usually bought by the case. We rank them live by cost per 10 g of protein.",
      },
      {
        q: "Are ready-to-drink protein shakes worth it?",
        a: "RTD shakes cost more per gram of protein than powder, but they're unbeatable for convenience. The picks at the top of this page get you the most protein for the money.",
      },
    ],
  },
  {
    slug: "cheapest-canned-fish-protein",
    title: "Cheapest Canned Fish & Seafood Protein",
    description:
      "Canned tuna, salmon, sardines, and more ranked by cost per gram of protein — shelf-stable protein that's cheap and lean.",
    intro:
      "Canned fish is one of the most underrated protein values in the store: shelf-stable, lean, and packed with 20+ g of protein per can for a couple of dollars. This page ranks canned tuna, salmon, sardines, and other seafood by cost per 10 g of protein so you can stock the pantry with cheap, high-quality protein.",
    limit: 18,
    filter: cat("canned-seafood"),
    faqs: [
      {
        q: "Is canned tuna a cheap source of protein?",
        a: "Yes. Canned tuna and other canned fish deliver 20+ g of protein per can for a low price, making them one of the cheapest lean protein sources per gram. This page ranks them live.",
      },
      {
        q: "Which canned fish has the most protein for the price?",
        a: "Chunk light tuna and pink salmon are usually the best value; sardines and albacore cost a bit more per gram. See the live ranking above.",
      },
    ],
  },
];

export const COLLECTION_BY_SLUG: Record<string, Collection> = Object.fromEntries(
  COLLECTIONS.map((c) => [c.slug, c]),
);
