/**
 * Apply verified field corrections to src/data/catalog.ts.
 *
 * Input: scripts/corrections.json — [{ id, field, oldValue, newValue, verdict,
 * evidence, recheckNote, confidence }] from the full-catalog verification sweep
 * (only recheck-accepted corrections belong in this file).
 *
 * Patches one field per entry inside the item's block. Guards against
 * impossible results (protein > serving weight, zero servings, absurd prices).
 * Run: npx tsx scripts/apply-corrections.ts [--dry] [--include-low]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { CATALOG } from "../src/data/catalog";

const dry = process.argv.includes("--dry");
const includeLow = process.argv.includes("--include-low");
const AS_OF = "2026-07";

type Correction = {
  id: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  verdict?: string;
  evidence?: string;
  recheckNote?: string;
  confidence: "high" | "medium" | "low";
};

const NUMERIC = new Set([
  "servingSizeGrams",
  "proteinPerServing_g",
  "calories",
  "packCount",
  "servingsPerContainer",
  "priceCents",
]);
const STRING = new Set(["name", "servingSizeLabel"]);

const corrections = JSON.parse(
  readFileSync(new URL("./corrections.json", import.meta.url), "utf8"),
) as Correction[];

const catalogPath = new URL("../src/data/catalog.ts", import.meta.url);
let src = readFileSync(catalogPath, "utf8");
const byId = new Map(CATALOG.map((c) => [c.id, c]));

// working copy of numbers so cross-field guards see earlier patches
const working = new Map(
  CATALOG.map((c) => [
    c.id,
    { protein: c.proteinPerServing_g, grams: c.servingSizeGrams, servings: c.servingsPerContainer },
  ]),
);

let applied = 0, skipped = 0, failed = 0;

function patchField(id: string, field: string, rendered: string): boolean {
  const anchor = `id: "${id}"`;
  const start = src.indexOf(anchor);
  if (start === -1) return false;
  const nextId = src.indexOf(`\n    id: "`, start + anchor.length);
  const end = nextId === -1 ? src.length : nextId;
  let block = src.slice(start, end);
  const before = block;

  if (field === "dietTags") {
    block = block.replace(/dietTags: \[[^\]]*\],/, `dietTags: ${rendered},`);
  } else if (NUMERIC.has(field)) {
    block = block.replace(
      new RegExp(`${field}: (?:\\d+(?:\\.\\d+)?|null),`),
      `${field}: ${rendered},`,
    );
  } else {
    block = block.replace(
      new RegExp(`${field}: "[^\\n]*",`),
      `${field}: ${rendered},`,
    );
  }
  if (field === "priceCents") {
    block = block.replace(/priceAsOf: "[^"]*",/, `priceAsOf: "${AS_OF}",`);
  }
  if (block === before) return false;
  src = src.slice(0, start) + block + src.slice(end);
  return true;
}

for (const c of corrections) {
  const seed = byId.get(c.id);
  const label = `${c.id}.${c.field}`;
  if (!seed) {
    console.log(`FAIL  ${label} — unknown id`);
    failed++;
    continue;
  }
  if (c.confidence === "low" && !includeLow) {
    console.log(`SKIP  ${label} — low confidence: ${c.recheckNote ?? c.evidence ?? ""}`);
    skipped++;
    continue;
  }

  let rendered: string;
  const w = working.get(c.id)!;
  if (c.field === "dietTags") {
    if (!Array.isArray(c.newValue) || c.newValue.some((t) => typeof t !== "string")) {
      console.log(`FAIL  ${label} — dietTags not a string array`);
      failed++;
      continue;
    }
    rendered = `[${(c.newValue as string[]).map((t) => JSON.stringify(t)).join(", ")}]`;
  } else if (NUMERIC.has(c.field)) {
    const n = c.newValue == null && c.field === "servingSizeGrams" ? null : Number(c.newValue);
    if (n !== null && !Number.isFinite(n)) {
      console.log(`FAIL  ${label} — non-numeric ${JSON.stringify(c.newValue)}`);
      failed++;
      continue;
    }
    // guards
    if (c.field === "priceCents" && (n! < 99 || n! > 30000)) {
      console.log(`SKIP  ${label} — implausible price ${n}`);
      skipped++;
      continue;
    }
    if ((c.field === "servingsPerContainer" || c.field === "packCount") && n! < 1) {
      console.log(`SKIP  ${label} — ${n} < 1`);
      skipped++;
      continue;
    }
    if (c.field === "proteinPerServing_g") {
      if (n! <= 0) { console.log(`SKIP  ${label} — protein ${n}`); skipped++; continue; }
      if (w.grams != null && n! > w.grams + 1) {
        console.log(`SKIP  ${label} — protein ${n} > serving ${w.grams}g (fix serving first?)`);
        skipped++;
        continue;
      }
      w.protein = n!;
    }
    if (c.field === "servingSizeGrams" && n != null) {
      if (n < w.protein - 1) {
        console.log(`SKIP  ${label} — serving ${n}g < protein ${w.protein}g`);
        skipped++;
        continue;
      }
      w.grams = n;
    }
    if (c.field === "servingsPerContainer") w.servings = n!;
    rendered = n === null ? "null" : String(n);
  } else if (STRING.has(c.field)) {
    if (typeof c.newValue !== "string" || !c.newValue.trim()) {
      console.log(`FAIL  ${label} — bad string`);
      failed++;
      continue;
    }
    rendered = JSON.stringify(c.newValue);
  } else {
    console.log(`FAIL  ${label} — unsupported field`);
    failed++;
    continue;
  }

  if (dry) {
    console.log(`WOULD ${label}: ${JSON.stringify(c.oldValue)} → ${rendered}`);
    applied++;
    continue;
  }
  if (patchField(c.id, c.field, rendered)) {
    console.log(`APPLY ${label}: ${JSON.stringify(c.oldValue)} → ${rendered}`);
    applied++;
  } else {
    console.log(`FAIL  ${label} — field pattern not found in block`);
    failed++;
  }
}

if (!dry) writeFileSync(catalogPath, src);
console.log(
  `\n${dry ? "[dry run] " : ""}applied=${applied} skipped=${skipped} failed=${failed} of ${corrections.length}`,
);
