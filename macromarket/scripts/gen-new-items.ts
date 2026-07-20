/**
 * Generate catalog entries from researched new items and append them to
 * src/data/catalog.ts (before the closing `];`).
 *
 * Input: scripts/new-items.json — array of researched+verified items:
 * { idSlug, name, brand, category, form, candidateAsin, servingSizeLabel,
 *   servingSizeGrams, proteinPerServing_g, calories, packCount,
 *   servingsPerContainer, dietTags, priceCents, priceSource, priceConfidence,
 *   imageAlt, editorialBlurb }
 *
 * Validates slugs, dedupes against the existing catalog, sanity-checks the
 * $/g math, and skips anything that fails. Run: npx tsx scripts/gen-new-items.ts [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";

const AS_OF = "2026-07";
const dry = process.argv.includes("--dry");

const CATEGORIES = new Set([
  "whey-protein","plant-protein","protein-bars","rtd-shakes","jerky-meat-snacks",
  "canned-seafood","greek-yogurt-cottage-cheese","protein-cereal-snacks",
  "nut-seed-butters","poultry-lean-meat","eggs-dairy","legumes-beans",
  "tofu-tempeh-soy","seafood-whole",
]);
const FORMS = new Set([
  "powder","bar","rtd-shake","jerky-meat-snack","canned-seafood","yogurt-dairy",
  "cereal-snack","nut-seed-butter","tofu-soy","whole-food",
]);
const DIET_TAGS = new Set([
  "vegan","vegetarian","pescatarian","keto","low-carb","gluten-free",
  "dairy-free","paleo","whole30",
]);

interface NewItem {
  idSlug: string;
  name: string;
  brand: string | null;
  category: string;
  form: string;
  candidateAsin: string | null;
  servingSizeLabel: string;
  servingSizeGrams: number | null;
  proteinPerServing_g: number;
  calories: number;
  packCount: number;
  servingsPerContainer: number;
  dietTags: string[];
  priceCents: number;
  priceSource: string;
  priceConfidence: string;
  imageAlt: string;
  editorialBlurb: string;
}

const items = JSON.parse(
  readFileSync(new URL("./new-items.json", import.meta.url), "utf8"),
) as NewItem[];

const existingIds = new Set(CATALOG.map((c) => c.id));
const seen = new Set<string>();
const blocks: string[] = [];
let added = 0, skippedCount = 0;

const q = (s: string) => JSON.stringify(s);

for (const it of items) {
  const id = it.idSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const problems: string[] = [];

  if (!id) problems.push("empty slug");
  if (existingIds.has(id)) problems.push("duplicate of existing catalog id");
  if (seen.has(id)) problems.push("duplicate within new items");
  if (!CATEGORIES.has(it.category)) problems.push(`bad category ${it.category}`);
  if (!FORMS.has(it.form)) problems.push(`bad form ${it.form}`);
  if (!(it.proteinPerServing_g > 0)) problems.push("no protein per serving");
  if (!(it.servingsPerContainer > 0)) problems.push("no servings");
  if (!(it.packCount >= 1)) problems.push("bad packCount");
  if (!(it.calories >= 0)) problems.push("bad calories");
  const price = Math.round(it.priceCents);
  if (!(price >= 99 && price <= 30000)) problems.push(`implausible price ${price}¢`);
  const totalProtein = it.proteinPerServing_g * it.servingsPerContainer;
  const cpg = price / totalProtein;
  if (!(cpg >= 0.3 && cpg <= 45)) problems.push(`implausible ${cpg.toFixed(2)}¢/g protein`);
  const source = it.priceSource === "grocery-est" ? "grocery-est" : "amazon-est";
  const asin = it.candidateAsin && /^B0[A-Z0-9]{8}$/.test(it.candidateAsin) ? it.candidateAsin : null;
  const tags = (it.dietTags ?? []).filter((t) => DIET_TAGS.has(t));

  if (problems.length) {
    console.log(`SKIP ${id || it.name}: ${problems.join("; ")}`);
    skippedCount++;
    continue;
  }
  seen.add(id);
  added++;

  blocks.push(`  {
    id: ${q(id)},
    name: ${q(it.name)},
    brand: ${it.brand ? q(it.brand) : "null"},
    category: ${q(it.category)},
    form: ${q(it.form)},
    imageUrl: "",
    imageAlt: ${q(it.imageAlt)},
    asin: ${asin ? q(asin) : "null"},
    fdcId: null,
    servingSizeLabel: ${q(it.servingSizeLabel)},
    servingSizeGrams: ${it.servingSizeGrams != null ? Math.round(it.servingSizeGrams) : "null"},
    proteinPerServing_g: ${it.proteinPerServing_g},
    calories: ${it.calories},
    packCount: ${Math.round(it.packCount)},
    servingsPerContainer: ${Math.round(it.servingsPerContainer)},
    dietTags: [${tags.map(q).join(", ")}],
    priceCents: ${price},
    priceAsOf: ${q(AS_OF)},
    priceSource: ${q(source)},
    editorialBlurb:
      ${q(it.editorialBlurb)},
  },`);
  console.log(`ADD  ${id.padEnd(52)} $${(price / 100).toFixed(2).padStart(7)}  ${cpg.toFixed(1)}¢/g  ${it.category}`);
}

if (!dry && blocks.length) {
  const catalogPath = new URL("../src/data/catalog.ts", import.meta.url);
  let src = readFileSync(catalogPath, "utf8");
  const closer = src.lastIndexOf("];");
  if (closer === -1) throw new Error("could not find catalog array closer");
  src =
    src.slice(0, closer) +
    `  // --- 2026-07 expansion: researched + price-verified additions ---\n` +
    blocks.join("\n") +
    "\n" +
    src.slice(closer);
  writeFileSync(catalogPath, src);
}
console.log(`\n${dry ? "[dry run] " : ""}added=${added} skipped=${skippedCount} of ${items.length}`);
