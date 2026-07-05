export const COLLECTIONS = {
  priceCache: "priceCache", // doc id = ASIN
  affiliateClicks: "affiliateClicks",
  chatLogs: "chatLogs", // AI coach usage: prompt, model, tokens, cost
  rateLimits: "rateLimits", // daily coach-call counters (cost ceiling)
  savedGoals: "savedGoals",
} as const;
