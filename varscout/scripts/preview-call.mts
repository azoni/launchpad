/**
 * Print what the top-of-page call card will actually say, using live production
 * data. Copy that reads badly on real numbers is a bug worth catching before deploy.
 * Run with: npx tsx scripts/preview-call.mts
 */
import { fetchSnapshotCached } from "../src/lib/variational/api";
import { rankPulse, DEFAULT_PULSE, type Tick } from "../src/lib/variational/pulse";
import type { Reference } from "../src/lib/reference/sources";
import type { MarketHistory } from "../src/lib/variational/types";

const BASE = "https://varscout.netlify.app";
const snap = await fetchSnapshotCached(0);
const ref = (await (await fetch(`${BASE}/api/reference`)).json()) as {
  markets: Record<string, Reference>;
  source: string | null;
};
const agg = (await (await fetch(`${BASE}/api/aggregates`)).json()) as {
  histories: Record<string, MarketHistory>;
  seed: Record<string, { t: number[]; m: number[]; v: number[]; o: number[] }>;
};

const buffers: Record<string, Tick[]> = {};
for (const [t, s] of Object.entries(agg.seed ?? {})) {
  buffers[t] = s.t.map((ts, i) => ({ ts, mark: s.m[i], vol24: s.v[i], oi: s.o[i], funding: 0 }));
}

const { scored } = rankPulse(snap.markets, buffers, agg.histories ?? {}, DEFAULT_PULSE, ref.markets);
const pc = (x: number | null, d = 2) => (x === null ? "—" : `${(x * 100).toFixed(d)}%`);

console.log(`source: ${ref.source}   qualifying: ${scored.length}\n`);
console.log("=== THE CALL (as rendered) ===");
for (const r of scored.slice(0, 4)) {
  console.log("");
  console.log(
    `  ${r.bias ?? "No clear side"}  ${r.ticker}   ${r.refPct24 !== null ? pc(r.refPct24, 1) + " today" : ""}`,
  );
  console.log(`  ${r.name}`);
  console.log(`    ${pc(r.breakevenPct).padStart(7)}  needed to break even`);
  console.log(`    ${pc(r.typicalMovePct).padStart(7)}  typical move in 4h`);
  console.log(
    `    ${((r.viability?.toFixed(1) ?? "—") + "x").padStart(7)}  edge over the spread ` +
      `(${(r.viability ?? 0) >= 3 ? "comfortable" : "thin — size down"})`,
  );
  const vol =
    r.volMult !== null && r.volMult >= 1.5
      ? `${r.volMult.toFixed(1)}x its normal volume`
      : r.refVol24 !== null
        ? `$${(r.refVol24 / 1e6).toFixed(1)}M traded today`
        : "active on Omni";
  console.log(`    why: ${vol}, ${r.flow}${r.bias ? `. Momentum favours ${r.bias.toLowerCase()}` : ""}`);
}

const noSide = scored.slice(0, 10).filter((r) => !r.bias).length;
console.log(`\ntop 10 with no directional read: ${noSide}`);
const noTypical = scored.slice(0, 10).filter((r) => r.typicalMovePct === null).length;
console.log(`top 10 missing a typical-move figure: ${noTypical}`);
