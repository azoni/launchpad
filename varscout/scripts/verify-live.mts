/**
 * End-to-end check against what production actually serves: pull the live
 * reference + aggregates and rank exactly as the browser does.
 * Run with: npx tsx scripts/verify-live.mts
 */
import { fetchSnapshotCached } from "../src/lib/variational/api";
import { rankPulse, DEFAULT_PULSE, type Tick } from "../src/lib/variational/pulse";
import type { Reference } from "../src/lib/reference/sources";
import type { MarketHistory } from "../src/lib/variational/types";

const BASE = "https://varscout.netlify.app";
const snap = await fetchSnapshotCached(0);

const ref = (await (await fetch(`${BASE}/api/reference`)).json()) as {
  source: string | null;
  covered: number;
  requested: number;
  markets: Record<string, Reference>;
};
const agg = (await (await fetch(`${BASE}/api/aggregates`)).json()) as {
  histories: Record<string, MarketHistory>;
  seed: Record<string, { t: number[]; m: number[]; v: number[]; o: number[] }>;
};

const buffers: Record<string, Tick[]> = {};
for (const [t, s] of Object.entries(agg.seed ?? {})) {
  buffers[t] = s.t.map((ts, i) => ({ ts, mark: s.m[i], vol24: s.v[i], oi: s.o[i], funding: 0 }));
}

console.log(`source: ${ref.source}  coverage: ${ref.covered}/${ref.requested}`);

const OLD = { ...DEFAULT_PULSE, minRefVolume: Infinity, minOmniVolume: 1_000_000 };
const before = rankPulse(snap.markets, buffers, agg.histories ?? {}, OLD, {});
const after = rankPulse(snap.markets, buffers, agg.histories ?? {}, DEFAULT_PULSE, ref.markets);

console.log(`qualifying  before: ${before.scored.length}   after: ${after.scored.length}`);
const beforeSet = new Set(before.scored.map((r) => r.ticker));

console.log(`\n${"#".padEnd(4)}${"ticker".padEnd(11)}${"24h".padStart(9)}${"spike".padStart(8)}${"real vol".padStart(11)}${"omni".padStart(10)}${"edge".padStart(7)}  new`);
after.scored.slice(0, 12).forEach((r, i) => {
  console.log(
    `${String(i + 1).padEnd(4)}${r.ticker.padEnd(11)}` +
      `${(r.refPct24 !== null ? (r.refPct24 * 100).toFixed(1) + "%" : "-").padStart(9)}` +
      `${(r.volMult !== null ? r.volMult.toFixed(1) + "x" : "-").padStart(8)}` +
      `${(r.refVol24 !== null ? "$" + (r.refVol24 / 1e6).toFixed(1) + "M" : "-").padStart(11)}` +
      `${("$" + (r.vol24 / 1e6).toFixed(2) + "M").padStart(10)}` +
      `${(r.viability !== null ? r.viability.toFixed(1) + "x" : "-").padStart(7)}` +
      `  ${beforeSet.has(r.ticker) ? "" : "NEW"}`,
  );
});

const gained = after.scored.filter((r) => !beforeSet.has(r.ticker));
const big = gained.filter((r) => Math.abs(r.refPct24 ?? 0) >= 0.05);
console.log(`\nnewly visible: ${gained.length}   of which moving 5%+ today: ${big.length}`);
console.log("exclusions:", Object.entries(after.excluded).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${v} ${k}`).join(", "));
