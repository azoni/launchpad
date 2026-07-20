/**
 * Apply reviewed baseline prices to src/data/catalog.ts.
 *
 * Input: scripts/price-review.json — [{ id, recommendedBaselineCents, verdict,
 * confidence, note }]. For every entry whose recommendation differs from the
 * current seed price, rewrites that item's `priceCents` (and stamps `priceAsOf`)
 * in place. Skips low-confidence recommendations unless --include-low.
 *
 * Run: npx tsx scripts/apply-prices.ts [--include-low] [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";

const AS_OF = "2026-07";
const includeLow = process.argv.includes("--include-low");
const dry = process.argv.includes("--dry");

interface Review {
  id: string;
  recommendedBaselineCents: number;
  verdict: string;
  confidence: "high" | "medium" | "low";
  note: string;
}

const reviews = JSON.parse(
  readFileSync(new URL("./price-review.json", import.meta.url), "utf8"),
) as Review[];

const catalogPath = new URL("../src/data/catalog.ts", import.meta.url);
let src = readFileSync(catalogPath, "utf8");

const byId = new Map(CATALOG.map((c) => [c.id, c]));
let applied = 0, unchanged = 0, skipped = 0, missing = 0;

for (const r of reviews) {
  const seed = byId.get(r.id);
  if (!seed) {
    console.log(`MISSING   ${r.id} — not in catalog`);
    missing++;
    continue;
  }
  const cents = Math.round(r.recommendedBaselineCents);
  if (!Number.isFinite(cents) || cents < 50 || cents > 30000) {
    console.log(`SKIP-BAD  ${r.id} — implausible ${cents}¢ (${r.verdict}) ${r.note}`);
    skipped++;
    continue;
  }
  if (r.confidence === "low" && !includeLow) {
    console.log(`SKIP-LOW  ${r.id} — low confidence (${r.verdict}): ${r.note}`);
    skipped++;
    continue;
  }
  if (cents === seed.priceCents) {
    unchanged++;
    continue;
  }

  // Patch this item's block only: slice from its `id:` line to the next item's.
  const anchor = `id: "${r.id}"`;
  const start = src.indexOf(anchor);
  if (start === -1) {
    console.log(`MISSING   ${r.id} — anchor not found in source`);
    missing++;
    continue;
  }
  const nextId = src.indexOf(`\n    id: "`, start + anchor.length);
  const end = nextId === -1 ? src.length : nextId;
  let block = src.slice(start, end);
  const before = block;
  block = block.replace(/priceCents: \d+,/, `priceCents: ${cents},`);
  block = block.replace(/priceAsOf: "[^"]*",/, `priceAsOf: "${AS_OF}",`);
  if (block === before) {
    console.log(`MISSING   ${r.id} — priceCents field not found in block`);
    missing++;
    continue;
  }
  src = src.slice(0, start) + block + src.slice(end);
  applied++;
  console.log(
    `APPLY     ${r.id.padEnd(48)} $${(seed.priceCents / 100).toFixed(2)} → $${(cents / 100).toFixed(2)}  (${r.verdict}, ${r.confidence})`,
  );
}

if (!dry) writeFileSync(catalogPath, src);
console.log(
  `\n${dry ? "[dry run] " : ""}applied=${applied} unchanged=${unchanged} skipped=${skipped} missing=${missing} of ${reviews.length}`,
);
