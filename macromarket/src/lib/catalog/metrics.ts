import type { CatalogMetrics, CatalogSeedItem } from "./types";

/** A "dose" of protein for the shopper-friendly secondary metric. */
export const PROTEIN_DOSE_G = 20;

/**
 * Compute the signature $/g-protein metric (and secondaries) for a seed item,
 * given the resolved price in cents (live if available, else curated baseline).
 * All money is kept in cents; rounding happens only at render.
 */
export function computeMetrics(
  seed: Pick<
    CatalogSeedItem,
    "servingsPerContainer" | "proteinPerServing_g" | "calories"
  >,
  priceCents: number | null,
): CatalogMetrics {
  const totalProteinG = seed.servingsPerContainer * seed.proteinPerServing_g;

  const costPerGramProteinCents =
    priceCents != null && totalProteinG > 0
      ? priceCents / totalProteinG
      : null;

  const proteinDosePriceCents =
    costPerGramProteinCents != null
      ? costPerGramProteinCents * PROTEIN_DOSE_G
      : null;

  const pricePerServingCents =
    priceCents != null && seed.servingsPerContainer > 0
      ? priceCents / seed.servingsPerContainer
      : null;

  const proteinDensity =
    seed.calories > 0 ? seed.proteinPerServing_g / (seed.calories / 100) : 0;

  return {
    totalProteinG,
    costPerGramProteinCents,
    proteinDosePriceCents,
    pricePerServingCents,
    proteinDensity,
  };
}

/** Sort key: cheapest $/g first, nulls (no price) always last. */
export function costSortKey(cents: number | null): number {
  return cents == null ? Number.POSITIVE_INFINITY : cents;
}
