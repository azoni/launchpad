import type { Timestamp } from "firebase-admin/firestore";

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface Product {
  asin: string;
  slug: string;
  title: string;
  category: string;
  featureBullets: string[];
  images: string[];
  rating: number | null;
  reviewCount: number | null;
  savingsPercent: number | null;
  savingsDisplay: string | null;
  isOnSale: boolean;
  availability: string | null;
  affiliateUrl: string;
  // Board game attributes
  playerCountMin: number;
  playerCountMax: number;
  bestPlayerCount: number | null;
  playTimeMin: number;
  playTimeMax: number;
  complexity: number; // 1.0 - 5.0 (BGG weight)
  ageMin: number;
  cooperative: boolean;
  partyFriendly: boolean;
  familyFriendly: boolean;
  themes: string[];
  mechanics: string[];
  popularityScore: number;
  bggId: number | null;
  bggRank: number | null;
  // Metadata
  lastAmazonSync: Timestamp | null;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface OnboardingAnswers {
  playerCount: "2" | "3-4" | "5+" | "any";
  playTime: "short" | "medium" | "long" | "any";
  complexity: "easy" | "medium" | "heavy" | "any";
  themes: string[];
}

export interface Session {
  anonymousId: string;
  email: string | null;
  onboardingAnswers: OnboardingAnswers;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Swipe Events
// ---------------------------------------------------------------------------

export type SwipeAction =
  | "like"
  | "dislike"
  | "superlike"
  | "skip"
  | "details"
  | "buyClick";

export interface SwipeEvent {
  productId: string; // ASIN
  action: SwipeAction;
  durationMs: number;
  deckPosition: number;
  surface: "onboarding" | "discovery" | "results_refine";
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Session Profiles (derived)
// ---------------------------------------------------------------------------

export interface AttributeWeights {
  themes: Record<string, number>;
  mechanics: Record<string, number>;
  complexity: number;
  playerCount: number;
  playTime: number;
  cooperative: number;
}

export interface SessionProfile {
  sessionId: string;
  category: string;
  attributeWeights: AttributeWeights;
  likedAsins: string[];
  dislikedAsins: string[];
  swipeCount: number;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------

export interface Bundle {
  sessionId: string | null;
  title: string;
  slug: string;
  scenario: string;
  productIds: string[]; // ASINs
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Recommendation Clicks
// ---------------------------------------------------------------------------

export type ClickSurface =
  | "swipe_card"
  | "results"
  | "bundle"
  | "seo_page";

export interface RecommendationClick {
  sessionId: string;
  productAsin: string;
  clickSurface: ClickSurface;
  createdAt: Timestamp;
}
