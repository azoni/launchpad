import type { Product, SessionProfile } from "../types";

export interface ScoredProduct {
  product: Product;
  score: number;
  breakdown: {
    attributeMatch: number;
    behaviorAffinity: number;
    popularityBoost: number;
    explorationBonus: number;
  };
  matchReason: string;
}

export interface RecommendationInput {
  products: Product[];
  profile: SessionProfile;
  count: number;
}
