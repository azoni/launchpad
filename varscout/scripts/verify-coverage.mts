/**
 * Before/after check: do the movers that were being filtered out now surface?
 * Run with: npx tsx scripts/verify-coverage.mts
 */
import { fetchSnapshotCached } from "../src/lib/variational/api";
import { buildReference } from "../src/lib/reference/sources";
import { rankPulse, DEFAULT_PULSE, type Tick } from "../src/lib/variational/pulse";
import type { MarketHistory } from "../src/lib/variational/types";

const snap = await fetchSnapshotCached(0);
const agg = (await (await fetch("https://varscout.netlify.app/api/aggregates").catch(() => null))?.json()) as
  | { histories: Record<string, MarketHistory>; seed: Record<string, { t: number[]; m: number[]; v: number[]; o: number[] }> }
  | undefined;

const H = agg?.histories ?? {};
const seed = agg?.seed ?? {};

// Rebuild the browser's tick buffers from the seed series, as a fresh visitor would.
const buffers: Record<string, Tick[]> = {};
for (const [ticker, s] of Object.entries(seed)) {
  buffers[ticker] = s.t.map((t, i) => ({ ts: t, mark: s.m[i], vol24: s.v[i], oi: s.o[i], funding: 0 }));
}

console.log("building reference from Binance...");
const built = await buildReference(snap.markets.map((m) => m.ticker), { spikeDepth: 40 });
const refs = built.markets;
console.log(`source: ${built.source}  attempts:`, built.attempts.map(a => a.source + (a.ok ? " ok" : " FAIL")).join(", "));
console.log(`reference coverage: ${Object.keys(refs).length}/${snap.markets.length}`);

const OLD = { ...DEFAULT_PULSE, minRefVolume: Infinity, minOmniVolume: 1_000_000 };
const before = rankPulse(snap.markets, buffers, H, OLD, {});
const after = rankPulse(snap.markets, buffers, H, DEFAULT_PULSE, refs);

console.log(`\nqualifying markets   before: ${before.scored.length}   after: ${after.scored.length}`);
console.log("\nexclusions after:");
for (const [k, v] of Object.entries(after.excluded).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}

const beforeSet = new Set(before.scored.map((r) => r.ticker));
const gained = after.scored.filter((r) => !beforeSet.has(r.ticker));

console.log(`\n--- top 15 now ranked ---`);
console.log(
  `${"#".padEnd(4)}${"ticker".padEnd(11)}${"24h".padStart(9)}${"spike".padStart(8)}${"real vol".padStart(11)}${"omni".padStart(10)}${"edge".padStart(7)}  new?`,
);
after.scored.slice(0, 15).forEach((r, i) => {
  console.log(
    `${String(i + 1).padEnd(4)}${r.ticker.padEnd(11)}` +
      `${(r.refPct24 !== null ? (r.refPct24 * 100).toFixed(1) + "%" : "—").padStart(9)}` +
      `${(r.volMult !== null ? r.volMult.toFixed(1) + "x" : "—").padStart(8)}` +
      `${(r.refVol24 !== null ? "$" + (r.refVol24 / 1e6).toFixed(1) + "M" : "—").padStart(11)}` +
      `${("$" + (r.vol24 / 1e6).toFixed(2) + "M").padStart(10)}` +
      `${(r.viability !== null ? r.viability.toFixed(1) + "x" : "—").padStart(7)}` +
      `  ${beforeSet.has(r.ticker) ? "" : "NEW"}`,
  );
});

console.log(`\nmarkets newly visible: ${gained.length}`);
const bigGains = gained.filter((r) => Math.abs(r.refPct24 ?? 0) >= 0.05);
console.log(`of which moving 5%+ on the day: ${bigGains.length}`);
for (const r of bigGains.slice(0, 10)) {
  console.log(
    `  ${r.ticker.padEnd(10)} ${((r.refPct24 ?? 0) * 100).toFixed(1).padStart(7)}%  ` +
      `real $${((r.refVol24 ?? 0) / 1e6).toFixed(1)}M vs omni $${(r.vol24 / 1e6).toFixed(2)}M`,
  );
}
