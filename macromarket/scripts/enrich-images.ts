/**
 * Build-time product-photo enrichment via Open Food Facts (free, no auth).
 * Writes src/data/images.json = { [slug]: imageUrl } for CONFIDENT matches only.
 * Careful matching (brand + product-type keyword) avoids wrong photos; anything
 * uncertain is skipped and keeps its branded placeholder tile.
 *
 * Run: npx tsx scripts/enrich-images.ts
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";
import type { ProteinForm } from "../src/lib/catalog/types";

const OUT = new URL("../src/data/images.json", import.meta.url);
const UA = "MacroMarket/1.0 (charltonuw@gmail.com)";

const FORM_KEYWORDS: Record<ProteinForm, string[]> = {
  powder: ["powder", "protein", "whey", "isolate", "casein"],
  bar: ["bar"],
  "rtd-shake": ["shake", "drink", "beverage"],
  "jerky-meat-snack": ["jerky", "stick", "meat", "biltong"],
  "canned-seafood": ["tuna", "salmon", "sardine", "mackerel", "fish", "seafood"],
  "yogurt-dairy": ["yogurt", "yoghurt", "cottage", "skyr", "cheese", "kefir"],
  "cereal-snack": ["cereal", "chip", "puff", "cracker", "snack", "crisp", "cookie", "granola"],
  "nut-seed-butter": ["butter", "peanut", "almond", "cashew", "seed"],
  "tofu-soy": ["tofu", "tempeh", "soy", "edamame"],
  "whole-food": [],
};

function clean(name: string): string {
  return name
    .replace(/\([^)]*\)/g, " ") // strip parentheticals like "(12-pack)"
    .replace(/\b\d+(\.\d+)?\s?(oz|lb|g|kg|ct|pack|count|x)\b/gi, " ")
    .replace(/[,–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface OffProduct {
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  categories_tags?: string[];
}

async function search(query: string): Promise<OffProduct[]> {
  const url =
    "https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=6" +
    `&fields=product_name,brands,image_front_url,categories_tags&search_terms=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: OffProduct[] };
    return data.products ?? [];
  } catch {
    return [];
  }
}

function accept(
  p: OffProduct,
  brand: string | null,
  form: ProteinForm,
): boolean {
  if (!p.image_front_url) return false;
  const pname = (p.product_name ?? "").toLowerCase();
  const pbrand = (p.brands ?? "").toLowerCase();
  const cats = (p.categories_tags ?? []).join(" ").toLowerCase();

  // brand must match (in brands field or product name) when we have one
  if (brand) {
    const b = brand.toLowerCase().split(/\s+/)[0];
    if (!pbrand.includes(b) && !pname.includes(b)) return false;
  }
  // product-type keyword must appear (blocks chips→bar style mismatches)
  const kws = FORM_KEYWORDS[form];
  if (kws.length > 0) {
    const hit = kws.some((k) => pname.includes(k) || cats.includes(k));
    if (!hit) return false;
  }
  return true;
}

async function main() {
  const existing: Record<string, string> = existsSync(OUT)
    ? JSON.parse(readFileSync(OUT, "utf8"))
    : {};
  const out: Record<string, string> = { ...existing };
  let hits = 0;
  let tried = 0;

  for (const item of CATALOG) {
    if (out[item.id]) {
      hits++;
      continue;
    }
    // Only chase photos for branded packaged goods; whole foods keep tiles.
    if (!item.brand) continue;
    tried++;
    const query = `${item.brand} ${clean(item.name)}`.trim();
    const products = await search(query);
    const match = products.find((p) => accept(p, item.brand, item.form));
    if (match?.image_front_url) {
      // store the URL exactly as OFF returns it (the revision number is required)
      out[item.id] = match.image_front_url;
      hits++;
      console.log(`✓ ${item.id} -> ${match.product_name}`);
    } else {
      console.log(`· ${item.id} (no confident match)`);
    }
    await sleep(350);
  }

  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nDone. ${hits} images for ${CATALOG.length} items (tried ${tried} branded).`);
}

main();
