import type { OnboardingAnswers, Product } from "../types";
import type { AttributeWeights } from "../types";

/** Map onboarding answers to initial attribute weights. */
export function initializeWeights(
  answers: OnboardingAnswers
): AttributeWeights {
  const weights: AttributeWeights = {
    themes: {},
    mechanics: {},
    complexity: 0,
    playerCount: 0,
    playTime: 0,
    cooperative: 0,
  };

  // Complexity preference
  switch (answers.complexity) {
    case "easy":
      weights.complexity = -0.5;
      break;
    case "medium":
      weights.complexity = 0;
      break;
    case "heavy":
      weights.complexity = 0.5;
      break;
    case "any":
      weights.complexity = 0;
      break;
  }

  // Player count preference
  switch (answers.playerCount) {
    case "2":
      weights.playerCount = 2;
      break;
    case "3-4":
      weights.playerCount = 3.5;
      break;
    case "5+":
      weights.playerCount = 6;
      break;
    case "any":
      weights.playerCount = 0;
      break;
  }

  // Play time preference
  switch (answers.playTime) {
    case "short":
      weights.playTime = 20;
      break;
    case "medium":
      weights.playTime = 45;
      break;
    case "long":
      weights.playTime = 90;
      break;
    case "any":
      weights.playTime = 0;
      break;
  }

  // Theme preferences from onboarding
  for (const theme of answers.themes) {
    weights.themes[theme] = 0.3;
  }

  return weights;
}

/** Build a numeric attribute vector for a product (for cosine similarity). */
export function productVector(product: Product): number[] {
  return [
    product.complexity / 5,
    product.playerCountMin / 10,
    product.playerCountMax / 10,
    product.playTimeMin / 180,
    product.playTimeMax / 180,
    product.cooperative ? 1 : 0,
    product.partyFriendly ? 1 : 0,
    product.familyFriendly ? 1 : 0,
  ];
}

/** Cosine similarity between two vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
