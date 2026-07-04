/**
 * Verify candidate ASINs against Amazon's public image CDN.
 * A valid/available ASIN returns a real JPEG; an invalid one returns a ~43-byte
 * placeholder GIF. We keep only verified ASINs → real product photos + direct
 * /dp/ product links. Writes src/data/verified.json = { [slug]: { asin, image } }.
 *
 * Run: npx tsx scripts/verify-asins.ts
 */
import { writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";

const OUT = new URL("../src/data/verified.json", import.meta.url);
const img = (asin: string) =>
  `https://m.media-amazon.com/images/P/${asin}._SL500_.jpg`;

async function verify(asin: string): Promise<boolean> {
  try {
    const res = await fetch(img(asin), {
      headers: { "User-Agent": "Mozilla/5.0 MacroMarket/1.0" },
    });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") ?? "";
    const buf = new Uint8Array(await res.arrayBuffer());
    // real product photo = jpeg and clearly larger than the 43-byte placeholder gif
    return type.includes("jpeg") && buf.byteLength > 1500;
  } catch {
    return false;
  }
}

async function pool<T>(items: T[], size: number, fn: (t: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (queue.length) {
        const it = queue.shift();
        if (it !== undefined) await fn(it);
      }
    }),
  );
}

async function main() {
  const candidates = CATALOG.filter((c) => c.asin);
  const out: Record<string, { asin: string; image: string }> = {};
  let done = 0;

  await pool(candidates, 8, async (item) => {
    const asin = item.asin as string;
    if (await verify(asin)) {
      out[item.id] = { asin, image: img(asin) };
    }
    done++;
    if (done % 20 === 0) console.log(`  checked ${done}/${candidates.length}`);
  });

  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(
    `\nVerified ${Object.keys(out).length}/${candidates.length} ASINs → real photos + direct links.`,
  );
}

main();
