/**
 * Audit every catalog ASIN against the LIVE Amazon title (not just image existence,
 * which is all verify-asins.ts checked). Classifies each as OK / WRONG / NODATA by
 * token overlap between the seed's brand+name and the real Amazon title, and writes a
 * title-validated verified map to scripts/verified.audit.json for review.
 *
 * Run (creds must be in env):  npx tsx scripts/audit-asins.ts
 */
import { writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";
import { getItemsBatched } from "../src/lib/amazon/client";

const STOP = new Set([
  "the","and","for","with","protein","powder","organic","natural","pack","count",
  "oz","lb","lbs","g","ct","of","original","flavor","free","non","gmo",
]);
const toks = (s: string) =>
  new Set((s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 2 && !/^\d+$/.test(t)));

async function main() {
  const withAsin = CATALOG.filter((c) => c.asin);
  const map = await getItemsBatched(withAsin.map((c) => c.asin as string));

  let ok = 0, wrong = 0, nodata = 0;
  const good: Record<string, { asin: string; image: string }> = {};

  for (const c of withAsin) {
    const asin = c.asin as string;
    const p = map.get(asin);
    const title = p?.title ?? null;
    const nameToks = toks(`${c.brand ?? ""} ${c.name}`);
    const titleToks = title ? toks(title) : new Set<string>();
    const overlap = [...nameToks].filter((t) => !STOP.has(t) && titleToks.has(t)).length;
    const status = !title ? "NODATA" : overlap >= 2 ? "OK" : "WRONG";

    if (status === "OK") {
      ok++;
      good[c.id] = { asin, image: `https://m.media-amazon.com/images/P/${asin}._SL500_.jpg` };
    } else if (status === "WRONG") wrong++;
    else nodata++;

    console.log(
      `${status.padEnd(7)} ${asin} ${c.id.padEnd(42)} | ${(title ?? "").slice(0, 52)}`,
    );
  }

  writeFileSync(
    new URL("./verified.audit.json", import.meta.url),
    JSON.stringify(good, null, 2) + "\n",
  );
  console.log(`\nOK=${ok}  WRONG=${wrong}  NODATA=${nodata}  of ${withAsin.length} ASINs`);
  console.log(`Title-validated map written to scripts/verified.audit.json (${ok} entries).`);
}

main();
