/**
 * Parity check: run the TypeScript scoring engine over a saved snapshot and
 * print the top results, so the output can be diffed against scout.py's
 * ranking of the same file. Run with: node scripts/verify-port.ts <snapshot.json>
 */
import { readFileSync } from "node:fs";
import { normalize } from "../src/lib/variational/api.ts";
import { rank } from "../src/lib/variational/scoring.ts";
import { DEFAULT_CONFIG, type RawStats } from "../src/lib/variational/types.ts";

const file = process.argv[2];
const notional = parseFloat(process.argv[3] ?? "100000");
const raw = JSON.parse(readFileSync(file, "utf8")) as RawStats;
const snap = normalize(raw);
const cfg = { ...DEFAULT_CONFIG, notional };
const { scored, excluded } = rank(snap.markets, {}, cfg);

console.log(`markets parsed: ${snap.markets.length}   notional: $${notional}`);
console.log(
  "excluded:",
  Object.entries(excluded)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v} ${k}`)
    .join(", "),
);
console.log(`qualifying: ${scored.length}`);
for (const r of scored.slice(0, 6)) {
  console.log(
    `  ${r.direction.padEnd(5)} ${r.ticker.padEnd(10)} ` +
      `net ${(r.netApr * 100).toFixed(2).padStart(7)}%  ` +
      `cost ${r.costBps.toFixed(2).padStart(6)}bp  ` +
      `payback ${(r.paybackDays * 24).toFixed(1).padStart(6)}h  ` +
      `tier ${r.tier.padEnd(18)} size ${r.sizeUnits.toFixed(4)}`,
  );
}
