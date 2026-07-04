/** Formatting helpers — all inputs in US cents (may be fractional). */

export function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

/** $/g protein, e.g. 3.7 cents/g → "$0.037/g". */
export function formatCostPerGram(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(3)}`;
}

/** Cost of a 20 g protein dose, e.g. "$0.74". */
export function formatDose(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDensity(gPer100kcal: number): string {
  return `${gPer100kcal.toFixed(1)} g/100 kcal`;
}

export function formatGrams(g: number): string {
  return `${Math.round(g)} g`;
}

/** "as of Jul 2026" from a "2026-07" string. */
export function formatAsOf(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  if (!y || !m) return yyyymm;
  const month = new Date(2000, m - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
  return `${month} ${y}`;
}
