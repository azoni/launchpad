/**
 * Resolve REAL, title-validated ASINs for every branded catalog item via Amazon
 * SearchItems. For each product we search "<brand> <name>", then accept a result
 * ONLY if its title shares the brand + >=2 significant name tokens (so a hallucinated
 * or wrong-product ASIN can never get in — worst case an item is left unmatched and
 * falls back to an affiliate search link + baseline price).
 *
 * Writes src/data/verified.json = { [slug]: { asin, image } }.
 * Run (creds in env):  npx tsx scripts/resolve-asins.ts
 */
import { writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";
import { searchItems } from "../src/lib/amazon/client";

const STOP = new Set([
  "the","and","for","with","protein","powder","organic","natural","pack","count",
  "oz","lb","lbs","ct","original","flavor","free","non","gmo","value","size","each",
]);
const toks = (s: string) =>
  new Set((s.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((t) => t.length > 2 && !/^\d+$/.test(t)));

async function main() {
  const items = CATALOG.filter((c) => c.asin); // branded packaged products only (whole foods stay search-link)
  const out: Record<string, { asin: string; image: string }> = {};
  let matched = 0, missed = 0, done = 0;

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

  writeFileSync(
    new URL("../src/data/verified.json", import.meta.url),
    JSON.stringify(out, null, 2) + "\n",
  );
  console.log(`\nDONE. Matched ${matched}, missed ${missed} of ${items.length}. Wrote src/data/verified.json.`);
}

main();
