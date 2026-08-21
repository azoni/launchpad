/**
 * Why aren't moving markets showing? Walk the pulse funnel stage by stage
 * against live data and print what dies where.
 * Run with: npx tsx scripts/diagnose-funnel.ts
 */
import { fetchSnapshotCached } from "../src/lib/variational/api";
import { costAt } from "../src/lib/variational/scoring";
import type { MarketHistory } from "../src/lib/variational/types";

const AGG = "https://varscout.netlify.app/api/aggregates";

const snap = await fetchSnapshotCached(0);
const agg = (await (await fetch(AGG)).json()) as {
  histories: Record<string, MarketHistory>;
  seed: Record<string, { t: number[]; m: number[]; v: number[]; o: number[] }>;
  runs: number;
};

const H = agg.histories ?? {};
const seed = agg.seed ?? {};
console.log(`collector runs: ${agg.runs}   markets in Omni: ${snap.markets.length}`);
console.log(`markets tracked by collector: ${Object.keys(H).length}`);
console.log(`markets with seed series:     ${Object.keys(seed).length}`);
console.log(
  `markets with usable vol (needed for viability): ${Object.values(H).filter((h) => h.vol != null).length}`,
);
console.log(
  `markets with volume baseline (needed for spike): ${Object.values(H).filter((h) => h.volRateMean != null).length}`,
);

// --- the funnel, at the shipped defaults ---
const NOTIONAL = 25_000;
const MIN_VOL = 1_000_000;
const MIN_VIA = 1.5;
const HOLD_H = 4;

let n = snap.markets.length;
const stages: [string, number][] = [["all Omni markets", n]];

const afterVol = snap.markets.filter((m) => m.vol24 >= MIN_VOL);
stages.push([`vol24 >= $${(MIN_VOL / 1e6).toFixed(0)}M`, afterVol.length]);

const afterQuote = afterVol.filter((m) => costAt(m.quotes, NOTIONAL));
stages.push(["has a usable quote", afterQuote.length]);

const afterHist = afterQuote.filter((m) => H[m.ticker]?.vol != null);
stages.push(["has collected volatility", afterHist.length]);

const afterVia = afterHist.filter((m) => {
  const c = costAt(m.quotes, NOTIONAL)!;
  const vol = H[m.ticker].vol!;
  const typical = vol * Math.sqrt(HOLD_H / (365 * 24));
  return typical / (c.costBps / 1e4) >= MIN_VIA;
});
stages.push([`edge vs spread >= ${MIN_VIA}x`, afterVia.length]);

console.log("\n--- funnel at shipped defaults ---");
let prev = n;
for (const [label, count] of stages) {
  const lost = prev - count;
  console.log(`  ${label.padEnd(30)} ${String(count).padStart(4)}   ${lost ? `(-${lost})` : ""}`);
  prev = count;
}

// --- what is actually moving that we cannot see? ---
// Use the seed series as the only price history available for every market.
console.log("\n--- biggest movers over the seed window, and whether they survive ---");
const movers: {
  ticker: string;
  movePct: number;
  vol24: number;
  spreadBps: number;
  tracked: boolean;
  hasVol: boolean;
  verdict: string;
}[] = [];

for (const m of snap.markets) {
  const s = seed[m.ticker];
  let movePct = 0;
  if (s && s.m.length >= 2 && s.m[0] > 0) movePct = (s.m[s.m.length - 1] - s.m[0]) / s.m[0];
  const c = costAt(m.quotes, NOTIONAL);
  const h = H[m.ticker];
  let verdict = "SHOWN";
  if (m.vol24 < MIN_VOL) verdict = "cut: thin volume";
  else if (!c) verdict = "cut: no quote";
  else if (h?.vol == null) verdict = "cut: no volatility yet";
  else {
    const typical = h.vol * Math.sqrt(HOLD_H / (365 * 24));
    if (typical / (c.costBps / 1e4) < MIN_VIA) verdict = "cut: spread too wide";
  }
  movers.push({
    ticker: m.ticker,
    movePct,
    vol24: m.vol24,
    spreadBps: m.spreadBps,
    tracked: Boolean(h),
    hasVol: h?.vol != null,
    verdict,
  });
}

movers.sort((a, b) => Math.abs(b.movePct) - Math.abs(a.movePct));
console.log(
  `${"ticker".padEnd(11)}${"move".padStart(9)}${"vol24".padStart(11)}${"spread".padStart(9)}  verdict`,
);
for (const r of movers.slice(0, 20)) {
  console.log(
    `${r.ticker.padEnd(11)}${(r.movePct * 100).toFixed(2).padStart(8)}%` +
      `${("$" + (r.vol24 / 1e6).toFixed(2) + "M").padStart(11)}` +
      `${r.spreadBps.toFixed(1).padStart(8)}b  ${r.verdict}`,
  );
}

const shown = movers.filter((r) => r.verdict === "SHOWN").length;
console.log(`\nmarkets that would currently render: ${shown}`);
const bigMoversCut = movers.filter((r) => Math.abs(r.movePct) > 0.01 && r.verdict !== "SHOWN").length;
console.log(`markets moving >1% that are cut: ${bigMoversCut}`);
