/**
 * Resolve REAL, title-validated ASINs for every branded catalog item via Amazon
 * SearchItems. For each product we search "<brand> <name>", then accept a result
 * ONLY if its title shares the brand + >=2 significant name tokens (so a hallucinated
 * or wrong-product ASIN can never get in — worst case an item is left unmatched and
 * falls back to an affiliate search link + baseline price).
 *
 * Writes src/data/verified.json = { [slug]: { asin, image } }.
 * Run (creds in env):  npx tsx scripts/resolve-asins.ts
 *   --only a,b,c   resolve just these slugs and MERGE into the existing
 *                  verified.json (other entries untouched). Without --only,
 *                  the whole eligible catalog is re-resolved from scratch.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";
import { searchItems } from "../src/lib/amazon/client";
import type { ProteinForm } from "../src/lib/catalog/types";

const STOP = new Set([
  "the","and","for","with","protein","powder","organic","natural","pack","count",
  "oz","lb","lbs","ct","original","flavor","free","non","gmo","value","size","each",
]);
const toks = (s: string) =>
  new Set((s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 2 && !/^\d+$/.test(t)));

// Cross-type products a search can surface (same brand, wrong item) — reject these so a
// "whey" item never matches a creatine tub, a bar never matches a drink mix, etc.
const GENERIC_BAD = [
  "shaker", "blender bottle", "funnel", "scoop", "sticker", "keychain",
  "t-shirt", "tank top", "sample", "gift card", "variety try",
];
const FORBIDDEN: Partial<Record<ProteinForm, string[]>> = {
  powder: [
    "creatine", "pre-workout", "pre workout", "preworkout", "bcaa", "eaa",
    "glutamine", "carnitine", "beta-alanine", "beta alanine", "nitric", "pump",
    "multivitamin", "vitamin c", "greens", "electrolyte", "hydration",
    "capsule", "tablet", "softgel", "gummy", "gummies",
  ],
  bar: ["powder", "drink mix", "creatine", "capsule", "gummies", "granola cereal"],
  "rtd-shake": ["powder", "creatine", "capsule", "protein bar"],
  "jerky-meat-snack": ["powder", "capsule", "dog treat", "cat treat"],
  "canned-seafood": ["powder", "capsule", "oil supplement", "fish oil"],
  "yogurt-dairy": ["powder", "capsule", "starter culture"],
  "cereal-snack": ["powder", "creatine", "capsule"],
  "nut-seed-butter": ["protein powder", "capsule", "powdered peanut"],
  "tofu-soy": ["powder", "sauce", "soy milk", "candle"],
  "whole-food": ["powder", "supplement", "capsule", "vitamin", "seasoning only"],
};

/** True if a candidate title is a wrong-type product for this item's form. */
function isForbidden(form: ProteinForm, title: string): boolean {
  const t = title.toLowerCase();
  if (GENERIC_BAD.some((b) => t.includes(b))) return true;
  return (FORBIDDEN[form] ?? []).some((b) => t.includes(b));
}

async function main() {
  // Branded, Amazon-purchasable products only — an item qualifies via a seed ASIN
  // or by being a branded "amazon-est" item (new seeds often ship without an ASIN).
  // Pure grocery whole foods (grocery-est/usda-ers, or no brand) stay search-link.
  const eligible = CATALOG.filter(
    (c) => c.asin || (c.brand && c.priceSource === "amazon-est"),
  );

  const onlyArg = process.argv.find((a) => a.startsWith("--only"));
  const onlyIds = onlyArg
    ? new Set(
        (onlyArg.includes("=") ? onlyArg.split("=")[1] : process.argv[process.argv.indexOf(onlyArg) + 1] ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      )
    : null;
  const items = onlyIds ? eligible.filter((c) => onlyIds.has(c.id)) : eligible;

  const verifiedPath = new URL("../src/data/verified.json", import.meta.url);
  const out: Record<string, { asin: string; image: string }> =
    onlyIds && existsSync(verifiedPath)
      ? (JSON.parse(readFileSync(verifiedPath, "utf8")) as Record<string, { asin: string; image: string }>)
      : {};
  // A re-resolved slug that fails to match must LOSE its stale entry (it was
  // wrong or dead), not silently keep it.
  if (onlyIds) for (const id of onlyIds) delete out[id];
  let matched = 0, missed = 0, done = 0;
  if (onlyIds) console.log(`--only mode: resolving ${items.length} of ${eligible.length} eligible (merging into existing verified.json)`);

  for (const c of items) {
    const brand = c.brand ?? "";
    const query = c.name.toLowerCase().includes(brand.toLowerCase()) ? c.name : `${brand} ${c.name}`.trim();
    const nameToks = toks(`${brand} ${c.name}`);
    const brandToks = toks(brand);

    let best: { asin: string; image: string; title: string; ov: number; s: number } | null = null;
    try {
      const results = await searchItems(query, "All");
      for (const r of results) {
        if (!r.asin || !r.title) continue;
        if (isForbidden(c.form, r.title)) continue; // wrong-type variant (creatine vs whey, etc.)
        const tt = toks(r.title);
        const ov = [...nameToks].filter((t) => !STOP.has(t) && tt.has(t)).length;
        const brandOk = brandToks.size === 0 || [...brandToks].some((b) => tt.has(b));
        if (ov < 2 || !brandOk) continue;
        const s = ov + (brandOk ? 2 : 0) + (r.priceCents != null ? 1 : 0);
        if (!best || s > best.s) {
          best = {
            asin: r.asin,
            image: r.images[0] ?? `https://m.media-amazon.com/images/P/${r.asin}._SL500_.jpg`,
            title: r.title,
            ov,
            s,
          };
        }
      }
    } catch (e) {
      console.log(`ERR    ${c.id} — ${(e as Error).message}`);
    }

    if (best) {
      matched++;
      out[c.id] = { asin: best.asin, image: best.image };
      console.log(`MATCH  ${c.id.padEnd(44)} ${best.asin} ov=${best.ov} | ${best.title.slice(0, 46)}`);
    } else {
      missed++;
      console.log(`----   ${c.id.padEnd(44)} (no confident match → search fallback)`);
    }
    done++;
    if (done % 25 === 0) console.log(`  …${done}/${items.length}  (matched ${matched})`);
  }

  writeFileSync(verifiedPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nDONE. Matched ${matched}, missed ${missed} of ${items.length}. Wrote src/data/verified.json.`);
}

main();
