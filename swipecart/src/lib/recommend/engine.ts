import type { Product, SessionProfile } from "../types";
import type { ScoredProduct, RecommendationInput } from "./types";
import { productVector, cosineSimilarity } from "./attributes";

// Scoring weights
const W_ATTRIBUTE = 0.4;
const W_BEHAVIOR = 0.3;
const W_POPULARITY = 0.15;
const W_EXPLORATION = 0.15;

// Epsilon-greedy: 80% exploit, 20% explore
const EXPLOIT_RATIO = 0.8;

/** Score how well a product matches the session's stated preferences. */
function attributeMatch(product: Product, profile: SessionProfile): number {
  const w = profile.attributeWeights;
  let score = 0;
  let factors = 0;

  // Complexity match
  if (w.complexity !== 0) {
    const prefComplexity = w.complexity > 0 ? 3.5 + w.complexity : 2 + w.complexity;
    const diff = Math.abs(product.complexity - prefComplexity);
    score += Math.max(0, 1 - diff / 3);
    factors++;
  }

  // Player count match
  if (w.playerCount > 0) {
    const inRange =
      w.playerCount >= product.playerCountMin &&
      w.playerCount <= product.playerCountMax;
    score += inRange ? 1 : 0.3;
    factors++;
  }

  // Play time match
  if (w.playTime > 0) {
    const avgTime = (product.playTimeMin + product.playTimeMax) / 2;
    const diff = Math.abs(avgTime - w.playTime);
    score += Math.max(0, 1 - diff / 120);
    factors++;
  }

  // Theme affinity
  const themeKeys = Object.keys(w.themes);
  if (themeKeys.length > 0) {
    let themeScore = 0;
    for (const theme of themeKeys) {
      if (product.themes.includes(theme)) {
        themeScore += w.themes[theme];
      }
    }
    score += Math.min(1, Math.max(0, themeScore));
    factors++;
  }

  // Cooperative preference
  if (w.cooperative !== 0) {
    const match =
      (w.cooperative > 0 && product.cooperative) ||
      (w.cooperative < 0 && !product.cooperative);
    score += match ? 1 : 0.2;
    factors++;
  }

  return factors === 0 ? 0.5 : score / factors;
}

/** Score similarity to previously liked/disliked products. */
function behaviorAffinity(
  product: Product,
  profile: SessionProfile,
  allProducts: Product[]
): number {
  if (profile.likedAsins.length === 0 && profile.dislikedAsins.length === 0) {
    return 0.5;
  }

  const pVec = productVector(product);

  // Similarity to liked products
  const likedProducts = allProducts.filter((p) =>
    profile.likedAsins.includes(p.asin)
  );
  let likedSim = 0;
  if (likedProducts.length > 0) {
    const sims = likedProducts
      .map((lp) => cosineSimilarity(pVec, productVector(lp)))
      .sort((a, b) => b - a);
    // Average top 3
    const topN = sims.slice(0, 3);
    likedSim = topN.reduce((sum, s) => sum + s, 0) / topN.length;
  }

  // Dissimilarity to disliked products
  const dislikedProducts = allProducts.filter((p) =>
    profile.dislikedAsins.includes(p.asin)
  );
  let dislikedSim = 0;
  if (dislikedProducts.length > 0) {
    dislikedSim =
      dislikedProducts
        .map((dp) => cosineSimilarity(pVec, productVector(dp)))
        .reduce((sum, s) => sum + s, 0) / dislikedProducts.length;
  }

  return Math.max(0, Math.min(1, (likedSim - dislikedSim + 1) / 2));
}

/** Normalized popularity score from rating and review count. */
function popularityBoost(product: Product): number {
  const rating = product.rating ?? 0;
  const reviews = product.reviewCount ?? 0;
  const ratingScore = rating / 5;
  const reviewScore = reviews > 0 ? Math.min(1, Math.log10(reviews) / 4) : 0;
  return ratingScore * reviewScore;
}

/** Bonus for theme/mechanic diversity within the session. */
function explorationBonus(
  product: Product,
  profile: SessionProfile
): number {
  const seenThemes = new Set<string>();
  const w = profile.attributeWeights;
  for (const theme of Object.keys(w.themes)) {
    if (Math.abs(w.themes[theme]) > 0.1) {
      seenThemes.add(theme);
    }
  }

  // Count how many of this product's themes are NOT heavily represented
  const novelThemes = product.themes.filter((t) => !seenThemes.has(t));
  if (product.themes.length === 0) return 0.5;
  return novelThemes.length / product.themes.length;
}

/** Generate a human-readable match reason. */
function generateMatchReason(
  product: Product,
  profile: SessionProfile
): string {
  const reasons: string[] = [];
  const w = profile.attributeWeights;

  // Find top matching themes
  const matchingThemes = product.themes.filter(
    (t) => w.themes[t] && w.themes[t] > 0.1
  );
  if (matchingThemes.length > 0) {
    reasons.push(`Matches your taste for ${matchingThemes.slice(0, 2).join(" and ")}`);
  }

  if (product.cooperative && w.cooperative > 0) {
    reasons.push("You prefer cooperative games");
  }

  if (product.rating && product.rating >= 4.5) {
    reasons.push(`Highly rated (${product.rating}/5)`);
  }

  if (reasons.length === 0) {
    reasons.push("A great pick based on your preferences");
  }

  return reasons.join(". ");
}

/** Score and rank all eligible products for a session. */
export function recommend(input: RecommendationInput): ScoredProduct[] {
  const { products, profile, count } = input;

  // Filter out already-seen products
  const seen = new Set([...profile.likedAsins, ...profile.dislikedAsins]);
  const eligible = products.filter(
    (p) => p.active && !seen.has(p.asin)
  );

  // Score everything
  const scored: ScoredProduct[] = eligible.map((product) => {
    const attrScore = attributeMatch(product, profile);
    const behavScore = behaviorAffinity(product, profile, products);
    const popScore = popularityBoost(product);
    const exploreScore = explorationBonus(product, profile);

    const totalScore =
      W_ATTRIBUTE * attrScore +
      W_BEHAVIOR * behavScore +
      W_POPULARITY * popScore +
      W_EXPLORATION * exploreScore;

    return {
      product,
      score: totalScore,
      breakdown: {
        attributeMatch: attrScore,
        behaviorAffinity: behavScore,
        popularityBoost: popScore,
        explorationBonus: exploreScore,
      },
      matchReason: generateMatchReason(product, profile),
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Epsilon-greedy selection
  const exploitCount = Math.ceil(count * EXPLOIT_RATIO);
  const exploreCount = count - exploitCount;

  const topPicks = scored.slice(0, exploitCount);
  const remaining = scored.slice(exploitCount);

  // Random exploration picks from the rest
  const explorePicks: ScoredProduct[] = [];
  for (let i = 0; i < exploreCount && remaining.length > 0; i++) {
    const idx = Math.floor(Math.random() * remaining.length);
    explorePicks.push(remaining.splice(idx, 1)[0]);
  }

  return [...topPicks, ...explorePicks];
}

/** Apply a swipe action to update profile weights. */
export function updateProfile(
  profile: SessionProfile,
  product: Product,
  action: "like" | "dislike" | "superlike" | "skip"
): SessionProfile {
  // Time decay existing weights
  const decayFactor = 0.95;
  const w = { ...profile.attributeWeights };
  w.themes = { ...w.themes };
  w.mechanics = { ...w.mechanics };

  for (const key of Object.keys(w.themes)) {
    w.themes[key] *= decayFactor;
  }
  for (const key of Object.keys(w.mechanics)) {
    w.mechanics[key] *= decayFactor;
  }

  // Determine delta based on action
  let delta = 0;
  switch (action) {
    case "superlike":
      delta = 0.2;
      break;
    case "like":
      delta = 0.1;
      break;
    case "dislike":
      delta = -0.05;
      break;
    case "skip":
      delta = 0;
      break;
  }

  if (delta !== 0) {
    // Update theme weights
    for (const theme of product.themes) {
      w.themes[theme] = (w.themes[theme] ?? 0) + delta;
    }
    // Update mechanic weights
    for (const mech of product.mechanics) {
      w.mechanics[mech] = (w.mechanics[mech] ?? 0) + delta;
    }
    // Update cooperative preference
    if (product.cooperative) {
      w.cooperative += delta;
    }
  }

  // Update liked/disliked lists
  const likedAsins = [...profile.likedAsins];
  const dislikedAsins = [...profile.dislikedAsins];
  if (action === "like" || action === "superlike") {
    likedAsins.push(product.asin);
  } else if (action === "dislike") {
    dislikedAsins.push(product.asin);
  }

  return {
    ...profile,
    attributeWeights: w,
    likedAsins,
    dislikedAsins,
    swipeCount: profile.swipeCount + 1,
  };
}
