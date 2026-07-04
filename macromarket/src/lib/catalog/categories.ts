import type { CategorySlug, ProteinForm } from "./types";

export interface CategoryMeta {
  slug: CategorySlug;
  name: string;
  /** short shelf label */
  short: string;
  /** "supplement", "snack", or "whole" — powers the leaderboard "include whole foods" toggle */
  group: "supplement" | "snack" | "whole";
  forms: ProteinForm[];
  blurb: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "whey-protein",
    name: "Whey & Casein Protein Powder",
    short: "Whey Powder",
    group: "supplement",
    forms: ["powder"],
    blurb:
      "Milk-based protein powders — whey concentrate, isolate, and casein. Usually the cheapest supplemental protein per gram.",
  },
  {
    slug: "plant-protein",
    name: "Plant Protein Powder",
    short: "Plant Powder",
    group: "supplement",
    forms: ["powder"],
    blurb:
      "Pea, soy, rice, and blended vegan protein powders for dairy-free and plant-based diets.",
  },
  {
    slug: "protein-bars",
    name: "Protein Bars",
    short: "Bars",
    group: "snack",
    forms: ["bar"],
    blurb:
      "Grab-and-go protein bars. Convenient, but usually a premium price per gram of protein.",
  },
  {
    slug: "rtd-shakes",
    name: "Ready-to-Drink Shakes",
    short: "Shakes",
    group: "snack",
    forms: ["rtd-shake"],
    blurb:
      "Pre-mixed protein shakes sold by the case — no blender, no mixing, just protein on the move.",
  },
  {
    slug: "jerky-meat-snacks",
    name: "Jerky & Meat Snacks",
    short: "Jerky",
    group: "snack",
    forms: ["jerky-meat-snack"],
    blurb:
      "Beef, turkey, and other dried-meat snacks — shelf-stable, high-protein, low-sugar.",
  },
  {
    slug: "canned-seafood",
    name: "Canned Tuna & Seafood",
    short: "Canned Fish",
    group: "whole",
    forms: ["canned-seafood"],
    blurb:
      "Canned tuna, salmon, and sardines — some of the cheapest complete protein you can buy.",
  },
  {
    slug: "greek-yogurt-cottage-cheese",
    name: "Greek Yogurt & Cottage Cheese",
    short: "Yogurt",
    group: "whole",
    forms: ["yogurt-dairy"],
    blurb:
      "High-protein dairy — Greek yogurt and cottage cheese pack a lot of protein for the price.",
  },
  {
    slug: "protein-cereal-snacks",
    name: "Protein Cereal & Snacks",
    short: "Protein Snacks",
    group: "snack",
    forms: ["cereal-snack"],
    blurb:
      "Protein cereals, puffs, chips, and cookies for when you want a protein hit that feels like a treat.",
  },
  {
    slug: "nut-seed-butters",
    name: "Nut & Seed Butters",
    short: "Nut Butters",
    group: "whole",
    forms: ["nut-seed-butter"],
    blurb:
      "Peanut, almond, and seed butters. Protein plus healthy fats — but watch the calories per gram of protein.",
  },
  {
    slug: "poultry-lean-meat",
    name: "Chicken & Lean Meat",
    short: "Poultry",
    group: "whole",
    forms: ["whole-food"],
    blurb:
      "Chicken breast, turkey, and lean cuts — the gold standard of cheap, high-quality whole-food protein.",
  },
  {
    slug: "eggs-dairy",
    name: "Eggs & Dairy",
    short: "Eggs",
    group: "whole",
    forms: ["whole-food"],
    blurb:
      "Eggs and milk — inexpensive, complete protein that anchors most budget high-protein diets.",
  },
  {
    slug: "legumes-beans",
    name: "Legumes, Beans & Lentils",
    short: "Legumes",
    group: "whole",
    forms: ["whole-food"],
    blurb:
      "Lentils, chickpeas, and beans — the cheapest protein per gram on the planet, and plant-based.",
  },
  {
    slug: "tofu-tempeh-soy",
    name: "Tofu, Tempeh & Soy",
    short: "Soy",
    group: "whole",
    forms: ["tofu-soy", "whole-food"],
    blurb:
      "Tofu, tempeh, and edamame — complete plant protein that's cheap and versatile.",
  },
  {
    slug: "seafood-whole",
    name: "Fresh & Frozen Seafood",
    short: "Seafood",
    group: "whole",
    forms: ["whole-food"],
    blurb:
      "Shrimp, tilapia, salmon, and other seafood — lean, high-protein whole foods.",
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, CategoryMeta> =
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Record<
    CategorySlug,
    CategoryMeta
  >;

export const DIET_TAG_LABELS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  pescatarian: "Pescatarian",
  keto: "Keto",
  "low-carb": "Low-carb",
  "gluten-free": "Gluten-free",
  "dairy-free": "Dairy-free",
  paleo: "Paleo",
  whole30: "Whole30",
};

export const FORM_LABELS: Record<ProteinForm, string> = {
  powder: "Powder",
  bar: "Bar",
  "rtd-shake": "Shake",
  "jerky-meat-snack": "Jerky",
  "canned-seafood": "Canned",
  "yogurt-dairy": "Yogurt",
  "cereal-snack": "Snack",
  "nut-seed-butter": "Nut butter",
  "tofu-soy": "Tofu/Soy",
  "whole-food": "Whole food",
};
