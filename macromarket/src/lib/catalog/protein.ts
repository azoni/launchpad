import { CATALOG } from "@/data/catalog";

/** Total grams of protein in a slug's package (pure catalog lookup, no firebase). */
const GRAMS = new Map<string, number>(
  CATALOG.map((s) => [s.id, s.servingsPerContainer * s.proteinPerServing_g]),
);

export function totalProteinGForSlug(slug: string): number {
  return Math.max(0, Math.round(GRAMS.get(slug) ?? 0));
}
