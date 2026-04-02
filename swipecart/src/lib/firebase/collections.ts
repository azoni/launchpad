/** Firestore collection names — single source of truth. */
export const COLLECTIONS = {
  products: "products",
  sessions: "sessions",
  swipeEvents: (sessionId: string) =>
    `sessions/${sessionId}/swipeEvents` as const,
  sessionProfiles: "sessionProfiles",
  bundles: "bundles",
  recommendationClicks: "recommendationClicks",
} as const;
