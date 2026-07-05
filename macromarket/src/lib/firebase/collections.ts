export const COLLECTIONS = {
  priceCache: "priceCache", // doc id = ASIN
  affiliateClicks: "affiliateClicks",
  chatLogs: "chatLogs", // AI coach usage: prompt, model, tokens, cost
  rateLimits: "rateLimits", // daily coach-call counters (cost ceiling)
  aggregates: "aggregates", // running totals (e.g. protein grams clicked)
  posts: "posts", // blog posts (doc id = slug)
  savedGoals: "savedGoals",
} as const;
