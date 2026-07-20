export const COLLECTIONS = {
  priceCache: "priceCache", // doc id = ASIN
  affiliateClicks: "affiliateClicks",
  chatLogs: "chatLogs", // AI coach usage: prompt, model, tokens, cost
  rateLimits: "rateLimits", // daily coach-call counters (cost ceiling)
  aggregates: "aggregates", // running totals (e.g. protein grams clicked)
  posts: "posts", // blog posts (doc id = slug)
  savedGoals: "savedGoals",
  socialPosts: "socialPosts", // daily-poster history: what was posted where, when
  socialQueue: "socialQueue", // auto-prepared daily IG posts (doc id = YYYY-MM-DD)
} as const;

/**
 * All per-item view counts live in ONE doc (aggregates/itemViews, field
 * counts.<slug>) so ranking by popularity costs a single read and each view
 * beacon costs a single increment write — free-tier friendly.
 */
export const ITEM_VIEWS_DOC = `${COLLECTIONS.aggregates}/itemViews`;
