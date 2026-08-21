/**
 * Feasibility probe: how much of Omni's book can external sources cover with
 * real global volume, and which source is worth wiring in?
 * Run with: npx tsx scripts/probe-sources.mts
 */
import { fetchSnapshotCached } from "../src/lib/variational/api";

const snap = await fetchSnapshotCached(0);
const tickers = snap.markets.map((m) => m.ticker);
console.log(`Omni markets: ${tickers.length}`);

const UA = { "User-Agent": "varscout-probe/1.0", Accept: "application/json" };

// --- Binance: one call returns every symbol with 24h volume + trade count ---
let binance: Record<string, { quoteVolume: number; pct: number; trades: number }> = {};
try {
  const t0 = Date.now();
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr", { headers: UA });
  const rows = (await res.json()) as {
    symbol: string;
    quoteVolume: string;
    priceChangePercent: string;
    count: number;
  }[];
  console.log(`\nBinance /ticker/24hr -> ${res.status}, ${rows.length} symbols, ${Date.now() - t0}ms`);
  for (const r of rows) {
    if (!r.symbol.endsWith("USDT")) continue;
    binance[r.symbol.slice(0, -4)] = {
      quoteVolume: parseFloat(r.quoteVolume),
      pct: parseFloat(r.priceChangePercent),
      trades: r.count,
    };
  }
  console.log(`  USDT pairs: ${Object.keys(binance).length}`);
} catch (e) {
  console.log("Binance failed:", (e as Error).message);
}

/** Omni prefixes multiplier tokens like 1000PEPE; Binance uses 1000PEPE too, but not always. */
const variants = (t: string) => [t, t.replace(/^1000/, ""), `1000${t}`];

const matched: string[] = [];
const unmatched: string[] = [];
for (const t of tickers) {
  const hit = variants(t).find((v) => binance[v]);
  (hit ? matched : unmatched).push(t);
}
console.log(`\nBinance coverage of Omni tickers: ${matched.length}/${tickers.length}`);

// How much of Omni's *open interest* do the matched markets represent? Coverage
// of the markets that matter is what counts, not raw ticker count.
const oiOf = (t: string) => {
  const m = snap.markets.find((x) => x.ticker === t)!;
  return m.oiLong + m.oiShort;
};
const totalOi = tickers.reduce((s, t) => s + oiOf(t), 0);
const matchedOi = matched.reduce((s, t) => s + oiOf(t), 0);
console.log(`  covering ${((matchedOi / totalOi) * 100).toFixed(1)}% of total open interest`);

console.log("\n--- the movers that were being cut: do they have real volume elsewhere? ---");
const CHECK = ["ONG", "GRASS", "CHIP", "ACE", "VVV", "1000PEPE", "ONDO", "CRV", "ALGO", "ASTER"];
console.log(`${"ticker".padEnd(11)}${"Omni 24h".padStart(11)}${"Binance 24h".padStart(14)}${"ratio".padStart(9)}${"24h %".padStart(8)}`);
for (const t of CHECK) {
  const m = snap.markets.find((x) => x.ticker === t);
  const hit = variants(t).find((v) => binance[v]);
  const b = hit ? binance[hit] : null;
  const omni = m ? m.vol24 : 0;
  console.log(
    `${t.padEnd(11)}${("$" + (omni / 1e6).toFixed(2) + "M").padStart(11)}` +
      `${(b ? "$" + (b.quoteVolume / 1e6).toFixed(1) + "M" : "—").padStart(14)}` +
      `${(b && omni > 0 ? (b.quoteVolume / omni).toFixed(0) + "x" : "—").padStart(9)}` +
      `${(b ? b.pct.toFixed(2) + "%" : "—").padStart(8)}`,
  );
}

console.log("\n--- unmatched sample (what Binance can't cover) ---");
console.log("  " + unmatched.slice(0, 40).join(" "));
console.log(`  ...${unmatched.length} total unmatched`);
