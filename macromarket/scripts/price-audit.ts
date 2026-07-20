/**
 * Audit curated baseline prices against LIVE Amazon prices for every item with a
 * verified ASIN. Reports baseline vs live, the ratio, and whether the live price
 * would be REJECTED by the suspect-price gate (ratio outside 0.35–2.6), which
 * means a wrong baseline is actively blocking the real price on the site.
 *
 * Writes scripts/price-audit.json. Run: npx tsx scripts/price-audit.ts
 */
import { writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";
import { getItemsBatched } from "../src/lib/amazon/client";
import VERIFIED from "../src/data/verified.json";

const verified = VERIFIED as Record<string, { asin: string; image: string }>;
const MIN_RATIO = 0.35;
const MAX_RATIO = 2.6;

async function main() {
  const items = CATALOG.filter((c) => verified[c.id]);
  const asins = items.map((c) => verified[c.id].asin);
  console.log(`Fetching live data for ${asins.length} verified ASINs…`);
  const live = await getItemsBatched(asins);

  const rows: Array<Record<string, unknown>> = [];
  let okCount = 0, offCount = 0, rejectedCount = 0, nodataCount = 0;

  for (const c of items) {
    const asin = verified[c.id].asin;
    const p = live.get(asin);
    const livePrice = p?.priceCents ?? null;
    const totalProtein = c.proteinPerServing_g * c.servingsPerContainer;

    let status: string;
    let ratio: number | null = null;
    if (livePrice == null) {
      status = "NODATA";
      nodataCount++;
    } else {
      ratio = +(livePrice / c.priceCents).toFixed(2);
      if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
        status = "REJECTED"; // suspect gate keeps (wrong?) baseline on site
        rejectedCount++;
      } else if (ratio < 0.8 || ratio > 1.25) {
        status = "OFF"; // live shown on site, but baseline is stale
        offCount++;
      } else {
        status = "OK";
        okCount++;
      }
    }

    rows.push({
      id: c.id,
      asin,
      status,
      baselineCents: c.priceCents,
      liveCents: livePrice,
      ratio,
      liveTitle: p?.title ?? null,
      inStock: p?.inStock ?? null,
      centsPerGramBaseline: totalProtein > 0 ? +(c.priceCents / totalProtein).toFixed(2) : null,
      centsPerGramLive:
        livePrice != null && totalProtein > 0 ? +(livePrice / totalProtein).toFixed(2) : null,
    });

    console.log(
      `${status.padEnd(9)} ${c.id.padEnd(46)} base=$${(c.priceCents / 100).toFixed(2).padStart(7)} live=${
        livePrice != null ? "$" + (livePrice / 100).toFixed(2) : "—"
      }${ratio != null ? ` (×${ratio})` : ""}`,
    );
  }

  writeFileSync(
    new URL("./price-audit.json", import.meta.url),
    JSON.stringify(rows, null, 1) + "\n",
  );
  console.log(
    `\nOK=${okCount}  OFF(stale baseline)=${offCount}  REJECTED(baseline blocks live)=${rejectedCount}  NODATA=${nodataCount}  of ${items.length}`,
  );
  console.log("Wrote scripts/price-audit.json");
}

main();
