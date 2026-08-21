/**
 * Check the pulse metrics against hand-computed expectations on synthetic
 * ticks. The viability figure decides whether a market is shown as tradeable at
 * all, so it has to be right.
 * Run with: npx tsx scripts/verify-pulse.ts
 */
import { pulse, type Tick, type PulseConfig } from "../src/lib/variational/pulse";
import { SECONDS_PER_YEAR } from "../src/lib/variational/history";
import type { Market, MarketHistory } from "../src/lib/variational/types";

const TICK = 70; // upstream advances in ~70s steps
const START = 1_700_000_000;
const ANNUAL_VOL = 0.8; // 80% annualized, typical for a liquid alt

/** A market whose spread is exactly 20bp round trip at every tier. */
function makeMarket(mark: number, vol24: number, oiL: number, oiS: number): Market {
  const half = 10 / 1e4;
  const q = { bid: String(mark * (1 - half)), ask: String(mark * (1 + half)) };
  return {
    ticker: "TEST",
    name: "Test Market",
    mark,
    bid: mark * (1 - half),
    ask: mark * (1 + half),
    spreadBps: 20,
    funding: 0.2,
    intervalS: 28800,
    vol24,
    oiLong: oiL,
    oiShort: oiS,
    quoteTs: "",
    quotes: { updated_at: "", base: q, size_1k: q, size_100k: q, size_1m: q },
  };
}

const baseHist = (vol: number): MarketHistory => ({
  n: 500,
  spanS: 500 * 300,
  fundingMean: 0.2,
  fundingSd: 0.01,
  signStability: 1,
  vol,
  volRateMean: 120_000 / 3600, // $120k/hr baseline
  volRateSd: 20_000 / 3600,
  volRateN: 400,
});

const cfg: PulseConfig = { notional: 25_000, holdHours: 4, minViability: 1.5, minVolume: 1_000_000 };

// 13 ticks (~14 min): +2% price, $360k/hr of fresh volume, OI +4%.
const nTicks = 13;
const volPerHour = 480_000; // 4x the 120k/hr baseline, clear of the 3x flag threshold
const ticks: Tick[] = Array.from({ length: nTicks }, (_, i) => {
  const frac = i / (nTicks - 1);
  return {
    ts: START + i * TICK,
    mark: 100 * (1 + 0.02 * frac),
    vol24: 5_000_000 + (volPerHour * (i * TICK)) / 3600,
    oi: 2_000_000 * (1 + 0.04 * frac),
    funding: 0.2,
  };
});

const windowS = ticks[nTicks - 1].ts - ticks[0].ts;
const last = ticks[nTicks - 1];
const r = pulse(
  makeMarket(last.mark, last.vol24, last.oi * 0.6, last.oi * 0.4),
  ticks,
  baseHist(ANNUAL_VOL),
  cfg,
);

const expBreakeven = 20 / 1e4;
const expTypical = ANNUAL_VOL * Math.sqrt(cfg.holdHours / (365 * 24));
const expSigma = 0.02 / (ANNUAL_VOL * Math.sqrt(windowS / SECONDS_PER_YEAR));

const checks: [string, number | null, number][] = [
  ["windowS", r.windowS, windowS],
  ["movePct", r.movePct, 0.02],
  ["volRate ($/hr)", r.volRate, volPerHour],
  ["volMult", r.volMult, volPerHour / 120_000],
  ["volZ", r.volZ, (volPerHour - 120_000) / 20_000],
  ["oiDeltaPct", r.oiDeltaPct, 0.04],
  ["breakevenPct", r.breakevenPct, expBreakeven],
  ["typicalMovePct", r.typicalMovePct, expTypical],
  ["viability", r.viability, expTypical / expBreakeven],
  ["moveSigma", r.moveSigma, expSigma],
];

let ok = true;
console.log(`${"metric".padEnd(18)}${"actual".padStart(15)}${"expected".padStart(15)}   result`);
for (const [label, got, want] of checks) {
  const pass = got !== null && Math.abs(got - want) <= Math.max(1e-6, Math.abs(want) * 1e-9);
  if (!pass) ok = false;
  console.log(
    `${label.padEnd(18)}${(got ?? NaN).toFixed(5).padStart(15)}${want.toFixed(5).padStart(15)}   ${pass ? "OK" : "MISMATCH"}`,
  );
}

console.log(`\nvol source     : ${r.volSource}  (expected "collected")`);
console.log(`flow read      : ${r.flow}  (expected "new longs")`);
console.log(`bias           : ${r.bias}  (expected LONG)`);
console.log(`flags          : ${r.flags.join(", ") || "none"}`);
console.log(
  `carry over 4h  : ${(r.carryOverHoldPct * 100).toFixed(4)}%  vs breakeven ${(expBreakeven * 100).toFixed(2)}%`,
);

const flowOk = r.flow === "new longs" && r.bias === "LONG" && r.volSource === "collected";
const spikeFlagged = r.flags.includes("volume spike");

// The premise of the whole pulse view: at these horizons carry cannot pay for
// the spread, so the move has to.
const carryCovers = r.carryOverHoldPct >= expBreakeven;
console.log(`carry alone covers the spread in 4h? ${carryCovers ? "yes" : "no"}  (expected: no)`);

// A quiet market must be rejected however much volume it prints.
const quiet = pulse(makeMarket(100, last.vol24, 1e6, 1e6), ticks, baseHist(0.02), cfg);
console.log(
  `\nquiet market (2% vol): ${quiet.excluded ?? "NOT EXCLUDED"} — viability ${quiet.viability?.toFixed(2)}`,
);
const quietOk = quiet.excluded === "spread too wide for the hold";

// Duplicate polls of an unchanged snapshot must not be counted as elapsed time.
const dupes: Tick[] = [ticks[0], ticks[0], ticks[0]];
const dup = pulse(makeMarket(100, last.vol24, 1e6, 1e6), dupes, baseHist(ANNUAL_VOL), cfg);
console.log(`duplicate-tick result: ${dup.excluded ?? "NOT EXCLUDED"} (expected "warming up")`);
const dupOk = dup.excluded === "warming up";

const allOk = ok && flowOk && spikeFlagged && !carryCovers && quietOk && dupOk;
console.log(allOk ? "\nPULSE OK" : "\nPULSE FAILED");
process.exit(allOk ? 0 : 1);
