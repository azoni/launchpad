/** Curated head-to-head comparison pairs. Both slugs must exist in the catalog. */
export const COMPARE_PAIRS: [string, string][] = [
  ["optimum-nutrition-gold-standard-whey", "chicken-breast-boneless-skinless"],
  ["quest-protein-bars-chocolate-chip", "large-eggs-dozen"],
  ["orgain-organic-plant-protein", "red-lentils-dry-2lb"],
  ["premier-protein-shake-12pack", "chicken-of-the-sea-chunk-light-tuna-12can"],
  ["fage-total-0-greek-yogurt-32oz", "jif-peanut-butter-creamy-40oz"],
];

export function compareSlug([a, b]: [string, string]): string {
  return `${a}-vs-${b}`;
}
