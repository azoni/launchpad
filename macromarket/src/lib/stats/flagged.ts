import { CATALOG } from "@/data/catalog";
import { computeMetrics } from "@/lib/catalog/metrics";

export interface FlaggedItem {
  slug: string;
  name: string;
  brand: string | null;
  per10gCents: number | null;
  priceCents: number;
  pricePerServingCents: number | null;
  reasons: string[];
}

/**
 * Catalog rows worth a human look, computed from the curated BASELINE data only
 * (no live fetch — so the admin loads instantly). Flags likely serving/pack-size
 * data errors: no value metric, an outlier cost per protein, a suspiciously cheap
 * value, or an implausible price per serving. (Live pack-mismatch rejections are
 * surfaced on each product page.)
 */
export function getFlagged(): FlaggedItem[] {
  const out: FlaggedItem[] = [];
  for (const s of CATALOG) {
    const m = computeMetrics(s, s.priceCents);
    const cpg = m.costPerGramProteinCents;
    const reasons: string[] = [];
    if (cpg == null) reasons.push("no value metric");
    else {
      if (cpg > 25) reasons.push("very high cost per protein");
      if (cpg < 0.5) reasons.push("suspiciously cheap (data?)");
    }
    if (m.pricePerServingCents != null && m.pricePerServingCents > 800)
      reasons.push("high price/serving (pack size?)");
    if (reasons.length) {
      out.push({
        slug: s.id,
        name: s.name,
        brand: s.brand,
        per10gCents: cpg,
        priceCents: s.priceCents,
        pricePerServingCents: m.pricePerServingCents,
        reasons,
      });
    }
  }
  return out
    .sort((a, b) => (b.per10gCents ?? 0) - (a.per10gCents ?? 0))
    .slice(0, 150);
}
