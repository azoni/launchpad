/**
 * Dump EVERY seed field for every catalog item plus deterministic sanity flags,
 * for the full-catalog verification sweep. Flags mark items whose numbers are
 * mathematically impossible or suspicious so verifiers prioritize them.
 * Run: npx tsx scripts/dump-catalog-full.ts  → scripts/catalog-full.json
 */
import { writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";
import VERIFIED from "../src/data/verified.json";

const verified = VERIFIED as Record<string, { asin: string; image: string }>;

// plausible cents-per-gram-of-protein band per form
const CPG_BAND: Record<string, [number, number]> = {
  powder: [1.5, 16],
  bar: [4, 25],
  "rtd-shake": [4, 20],
  "jerky-meat-snack": [8, 40],
  "canned-seafood": [3, 25],
  "yogurt-dairy": [2, 15],
  "cereal-snack": [5, 95],
  "nut-seed-butter": [3, 35],
  "tofu-soy": [1, 14],
  "whole-food": [0.4, 25],
};

// name pack spec like "(5 lb)", "(32 oz)", "(2 lb ... )" → grams (single unit)
function impliedUnitGrams(name: string): number | null {
  const lb = name.match(/([\d.]+)\s*lb/i);
  if (lb) return Math.round(parseFloat(lb[1]) * 453.6);
  const kg = name.match(/([\d.]+)\s*kg/i);
  if (kg) return Math.round(parseFloat(kg[1]) * 1000);
  const oz = name.match(/([\d.]+)\s*oz/i);
  if (oz) return Math.round(parseFloat(oz[1]) * 28.35);
  return null;
}

function packFromName(name: string): number | null {
  const m =
    name.match(/(\d+)[-\s]?(?:pack|count|ct|packets?|cans?|pouch(?:es)?|bars?|cups?|bottles?)\b/i) ??
    name.match(/\b(\d+)\s*[×x]\s*[\d.]/);
  return m ? parseInt(m[1], 10) : null;
}

const rows = CATALOG.map((c) => {
  const flags: string[] = [];
  const totalProtein = c.proteinPerServing_g * c.servingsPerContainer;
  const cpg = totalProtein > 0 ? c.priceCents / totalProtein : null;

  if (c.servingSizeGrams != null && c.proteinPerServing_g > c.servingSizeGrams) {
    flags.push(`IMPOSSIBLE: ${c.proteinPerServing_g}g protein > ${c.servingSizeGrams}g serving`);
  }
  if (c.calories > 0 && c.proteinPerServing_g * 4 > c.calories * 1.2) {
    flags.push(`SUSPECT: protein calories (${c.proteinPerServing_g * 4}) exceed label calories (${c.calories})`);
  }
  const band = CPG_BAND[c.form];
  if (cpg != null && band && (cpg < band[0] || cpg > band[1])) {
    flags.push(`SUSPECT: ${cpg.toFixed(1)}¢/g protein outside ${c.form} band ${band[0]}-${band[1]}`);
  }
  const namePack = packFromName(c.name);
  if (namePack != null && namePack !== c.packCount && namePack !== c.servingsPerContainer) {
    flags.push(`CHECK: name says ${namePack}-pack but packCount=${c.packCount}, servings=${c.servingsPerContainer}`);
  }
  // tub math: unit weight vs servings × serving grams (single-unit products only)
  const unitG = impliedUnitGrams(c.name);
  if (unitG != null && c.packCount === 1 && c.servingSizeGrams != null && c.servingSizeGrams > 0) {
    const impliedServings = unitG / c.servingSizeGrams;
    const ratio = c.servingsPerContainer / impliedServings;
    if (ratio < 0.75 || ratio > 1.35) {
      flags.push(
        `CHECK: name implies ~${impliedServings.toFixed(0)} servings (${unitG}g / ${c.servingSizeGrams}g) but servingsPerContainer=${c.servingsPerContainer}`,
      );
    }
  }

  return {
    id: c.id,
    name: c.name,
    brand: c.brand,
    category: c.category,
    form: c.form,
    servingSizeLabel: c.servingSizeLabel,
    servingSizeGrams: c.servingSizeGrams,
    proteinPerServing_g: c.proteinPerServing_g,
    calories: c.calories,
    packCount: c.packCount,
    servingsPerContainer: c.servingsPerContainer,
    dietTags: c.dietTags,
    priceCents: c.priceCents,
    priceSource: c.priceSource,
    centsPerGramProtein: cpg != null ? +cpg.toFixed(2) : null,
    verifiedAsin: verified[c.id]?.asin ?? null,
    flags,
  };
});

writeFileSync(
  new URL("./catalog-full.json", import.meta.url),
  JSON.stringify(rows, null, 1) + "\n",
);
const flagged = rows.filter((r) => r.flags.length);
console.log(`Wrote ${rows.length} rows; ${flagged.length} flagged:`);
for (const r of flagged) console.log(`  ${r.id}: ${r.flags.join(" | ")}`);
