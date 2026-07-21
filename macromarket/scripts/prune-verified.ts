/**
 * Prune bad entries from verified.json after a resolve + price audit:
 *  - every REJECTED audit row (live price wildly off baseline = wrong pack/product;
 *    the site would show the baseline but link the wrong listing)
 *  - a manual list of matches confirmed wrong by title (wrong size/variant/product)
 *    whose price happens to fall inside the suspect gate, so only a human catches it
 * Dropped items fall back to the affiliate search link + curated baseline — honest.
 *
 * Prints remaining big price deviations for review.
 * Run after price-audit.ts: npx tsx scripts/prune-verified.ts
 */
import { readFileSync, writeFileSync } from "node:fs";

// Confirmed-wrong matches from the 2026-07 resolve (checked against live titles).
// NOTE: items re-resolved in the verify round (body-fortress, special-k, wilde
// chicken chips) were removed from this list — their pack was corrected and the
// fresh ASIN passed the audit, so dropping them again would be wrong.
const MANUAL_DROP = [
  // orphaned verified.json entry — item removed as a duplicate of
  // explore-cuisine-edamame-spaghetti-8oz
  "explore-cuisine-organic-edamame-spaghetti-8-oz",
  "fage-total-0-greek-yogurt-32oz", // matched 16oz listing
  "jif-peanut-butter-creamy-40oz", // matched 4-lb can
  "krave-beef-jerky-chili-lime-9oz", // matched 2.7oz bag
  "jack-links-beef-jerky-original", // matched 8oz Half Pounder (item is 16oz)
  "muscle-milk-cottage-cheese-pnut", // matched a Breakstone's product
  "season-mackerel-olive-oil-12can", // matched Season sardines
  "rx-nut-butter-vanilla-10pack", // matched RXBAR oat BARS
  "rx-nut-butter-chocolate-10pack", // matched RXBAR oat BARS
  "wild-planet-pink-salmon-3can", // matched sockeye salmon
  "muscle-milk-zero-20g-12pack", // matched Genuine line (duplicate ASIN)
  "horizon-organic-high-protein-whole-milk-64oz", // matched regular shelf-stable milk
  "chobani-zero-sugar-vanilla-4pack", // matched "Less Sugar" line, different product
  "cellucor-cor-performance-whey-4lb", // matched C4 whey, different line/size
  "adams-natural-creamy-peanut-butter-36oz", // matched 500 g jar
  "skippy-natural-creamy-peanut-butter-40oz", // matched 26.5oz jar
  "dukes-smoked-shorty-sausages-original-16oz", // matched 7oz bag
  "chomps-turkey-sticks-original-12pack", // matched Pepperoni flavor listing
  "keystone-all-natural-chicken-28oz", // matched a 48-can bundle
  "trident-alaska-salmon-burgers-12ct", // matched a 50-count case
  // second pass — wrong pack/bundle confirmed via live title + price review:
  "barebells-caramel-cashew-12pack", // matched 24-pack
  "fairlife-core-power-elite-12pack", // matched 3P "Worldwide Nutrition Bundle"
  "starkist-chunk-light-tuna-pouch-10pack", // matched 24-pack
  "textured-vegetable-protein-2lb", // matched 10 oz bag
  "david-protein-bar-chocolate-chip-12pack", // matched 24-pack
  "core-power-elite-vanilla-12pack", // live ×2.6 — bundle/gouged listing
  "perfect-bar-peanut-butter-8pack", // matched coconut flavor, bigger pack
  "ensure-high-protein-16g-12pack", // live ×2.27 — likely 24-pack listing
  "muscle-milk-genuine-25g-12pack", // matched 14 oz bottles (item is 11.16 oz)
  "genova-yellowfin-tuna-olive-oil-12can", // live ×0.53 — smaller pack listing
  "brunswick-kipper-snacks-18can", // pack count unverifiable from listing
  "premier-protein-chocolate-almond-cereal-9oz", // live ×1.97 — 2-pack listing
  "once-again-sunflower-butter-16oz", // live ×2.43 — multipack listing
  "nutricost-whey-protein-concentrate-5lb", // live ×1.85 — gouged/bundle listing
  "vega-sport-premium-protein-4lb", // live ×1.72 — gouged listing
  "gold-standard-whey-isolate-1-58lb", // live ×1.64 — larger-size listing
  "barilla-protein-plus-penne-8pack", // matched a single 14.5 oz box
  "explore-cuisine-red-lentil-penne-6pack", // live ×1.55 — pack mismatch
];

interface AuditRow {
  id: string;
  asin: string;
  status: string;
  baselineCents: number;
  liveCents: number | null;
  ratio: number | null;
  liveTitle: string | null;
}

const audit = JSON.parse(
  readFileSync(new URL("./price-audit.json", import.meta.url), "utf8"),
) as AuditRow[];
const verifiedPath = new URL("../src/data/verified.json", import.meta.url);
const verified = JSON.parse(readFileSync(verifiedPath, "utf8")) as Record<
  string,
  { asin: string; image: string }
>;

let dropped = 0;
const dropAndLog = (id: string, why: string) => {
  if (verified[id]) {
    delete verified[id];
    dropped++;
    console.log(`DROP  ${id.padEnd(50)} ${why}`);
  }
};

for (const id of MANUAL_DROP) dropAndLog(id, "manual: wrong product/size match");
for (const row of audit) {
  if (row.status === "REJECTED") {
    dropAndLog(
      row.id,
      `rejected ×${row.ratio} | ${(row.liveTitle ?? "").slice(0, 48)}`,
    );
  }
}

writeFileSync(verifiedPath, JSON.stringify(verified, null, 2) + "\n");
console.log(
  `\nDropped ${dropped}. verified.json now has ${Object.keys(verified).length} entries.`,
);

console.log("\nRemaining deviations >±35% (review — stale baseline vs wrong pack):");
for (const row of audit) {
  if (!verified[row.id] || row.ratio == null) continue;
  if (row.ratio > 1.35 || row.ratio < 0.65) {
    console.log(
      `  ${row.id.padEnd(50)} base=$${(row.baselineCents / 100).toFixed(2)} live=$${((row.liveCents ?? 0) / 100).toFixed(2)} ×${row.ratio} | ${(row.liveTitle ?? "").slice(0, 56)}`,
    );
  }
}
