/**
 * USDA FoodData Central client — whole-food nutrition provenance.
 *
 * Free API; needs an api.data.gov key in USDA_FDC_API_KEY (DEMO_KEY works for
 * light dev use). Protein is nutrient number "203" (nutrientId 1003), reported
 * per 100 g. Used at seed/curation time (see scripts/), not on the hot path.
 */

const BASE = "https://api.nal.usda.gov/fdc/v1";

function apiKey(): string {
  return process.env.USDA_FDC_API_KEY ?? "DEMO_KEY";
}

export interface UsdaFoodHit {
  fdcId: number;
  description: string;
  dataType: string;
  proteinPer100g: number | null;
  caloriesPer100g: number | null;
}

interface FdcNutrient {
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
  nutrient?: { number?: string; name?: string };
  amount?: number;
}

function readNutrient(
  nutrients: FdcNutrient[] | undefined,
  numbers: string[],
): number | null {
  if (!nutrients) return null;
  for (const n of nutrients) {
    const num = n.nutrientNumber ?? n.nutrient?.number;
    if (num && numbers.includes(num)) {
      const v = n.value ?? n.amount;
      if (typeof v === "number") return v;
    }
  }
  return null;
}

export async function searchFood(
  query: string,
  dataTypes: string[] = ["Foundation", "SR Legacy"],
): Promise<UsdaFoodHit[]> {
  const url = `${BASE}/foods/search?api_key=${apiKey()}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, dataType: dataTypes, pageSize: 10 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.foods ?? []).map(
      (f: { fdcId: number; description: string; dataType: string; foodNutrients?: FdcNutrient[] }) => ({
        fdcId: f.fdcId,
        description: f.description,
        dataType: f.dataType,
        proteinPer100g: readNutrient(f.foodNutrients, ["203", "1003"]),
        caloriesPer100g: readNutrient(f.foodNutrients, ["208", "1008"]),
      }),
    );
  } catch {
    return [];
  }
}

/** Protein grams per 100 g for a given FDC id. null if unavailable. */
export async function getFoodProteinPer100g(
  fdcId: number,
): Promise<number | null> {
  const url = `${BASE}/food/${fdcId}?api_key=${apiKey()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return readNutrient(data.foodNutrients, ["203", "1003"]);
  } catch {
    return null;
  }
}
