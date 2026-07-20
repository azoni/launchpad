/**
 * Dump a compact catalog summary (id, name, brand, category, price, protein math,
 * verified-ASIN status) to scripts/catalog-summary.json for auditing/expansion work.
 * Run: npx tsx scripts/dump-catalog.ts
 */
import { writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";
import VERIFIED from "../src/data/verified.json";

const verified = VERIFIED as Record<string, { asin: string; image: string }>;

const rows = CATALOG.map((c) => {
  const totalProtein = c.proteinPerServing_g * c.servingsPerContainer;
  return {
    id: c.id,
    name: c.name,
    brand: c.brand,
    category: c.category,
    priceCents: c.priceCents,
    priceSource: c.priceSource,
    proteinPerServing_g: c.proteinPerServing_g,
    servingsPerContainer: c.servingsPerContainer,
    packCount: c.packCount,
    totalProteinG: totalProtein,
    centsPerGram: totalProtein > 0 ? +(c.priceCents / totalProtein).toFixed(2) : null,
    verifiedAsin: verified[c.id]?.asin ?? null,
  };
});

writeFileSync(
  new URL("./catalog-summary.json", import.meta.url),
  JSON.stringify(rows, null, 1) + "\n",
);
console.log(`Wrote ${rows.length} rows to scripts/catalog-summary.json`);
