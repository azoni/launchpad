/**
 * Check that the incremental accumulator matches a direct batch computation.
 * Incremental sums are the easy thing to get wrong, and a silently wrong
 * realized-vol number would poison every carry/vol ratio in the app.
 * Run with: node --experimental-strip-types scripts/verify-history.ts
 */
import { accumulate, derive, SECONDS_PER_YEAR, type Accum } from "../src/lib/variational/history.ts";
import type { Market } from "../src/lib/variational/types.ts";

// Deterministic pseudo-random walk so the check is reproducible.
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const N = 200;
const obs: { ts: number; funding: number; mark: number }[] = [];
let mark = 100;
let ts = 1_700_000_000;
for (let i = 0; i < N; i++) {
  // Irregular cadence, which is exactly what dt-scaling has to survive.
  ts += 240 + Math.floor(rnd() * 240);
  mark *= Math.exp((rnd() - 0.5) * 0.01);
  const funding = i < 150 ? 0.3 + (rnd() - 0.5) * 0.1 : -0.2 + (rnd() - 0.5) * 0.1;
  obs.push({ ts, funding, mark });
}

// --- incremental ---
let acc: Accum | undefined;
for (const o of obs) {
  acc = accumulate(acc, { ticker: "T", mark: o.mark, funding: o.funding } as Market, o.ts);
}
const inc = derive(acc, obs[obs.length - 1].funding);

// --- batch ---
const f = obs.map((o) => o.funding);
const mean = f.reduce((s, x) => s + x, 0) / f.length;
const fsd = Math.sqrt(f.reduce((s, x) => s + (x - mean) ** 2, 0) / f.length);
const nowSign = obs[obs.length - 1].funding > 0;
const stability = f.filter((x) => x > 0 === nowSign && x !== 0).length / f.length;
const scaled: number[] = [];
for (let i = 1; i < obs.length; i++) {
  const dt = obs[i].ts - obs[i - 1].ts;
  scaled.push(Math.log(obs[i].mark / obs[i - 1].mark) / Math.sqrt(dt));
}
const rmean = scaled.reduce((s, x) => s + x, 0) / scaled.length;
const rsd = Math.sqrt(scaled.reduce((s, x) => s + (x - rmean) ** 2, 0) / scaled.length);
const batchVol = rsd * Math.sqrt(SECONDS_PER_YEAR);

const rows: [string, number | null, number][] = [
  ["n", inc.n, N],
  ["fundingMean", inc.fundingMean, mean],
  ["fundingSd", inc.fundingSd, fsd],
  ["signStability", inc.signStability, stability],
  ["realized vol", inc.vol, batchVol],
  ["spanS", inc.spanS, obs[N - 1].ts - obs[0].ts],
];

let ok = true;
console.log(`${"metric".padEnd(16)}${"incremental".padStart(18)}${"batch".padStart(18)}${"  match"}`);
for (const [label, a, b] of rows) {
  const diff = a === null ? Infinity : Math.abs(a - b);
  const pass = diff < 1e-9 || (b !== 0 && diff / Math.abs(b) < 1e-9);
  if (!pass) ok = false;
  console.log(
    `${label.padEnd(16)}${(a ?? NaN).toFixed(10).padStart(18)}${b.toFixed(10).padStart(18)}   ${pass ? "OK" : "MISMATCH"}`,
  );
}
console.log(`\nseries capped correctly: ${inc.fundingSeries?.length === Math.min(N, 288) ? "OK" : "FAIL"}`);
console.log(ok ? "\nPARITY OK" : "\nPARITY FAILED");
process.exit(ok ? 0 : 1);
