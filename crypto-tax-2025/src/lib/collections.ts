// Centralized Firestore collection names. Import from here, never type strings.
export const COLLECTIONS = {
  projects: "projects",
  wallets: "wallets",
  dataSources: "dataSources",
  rawTransactions: "rawTransactions",
  normalizedTransactions: "normalizedTransactions",
  transferMatches: "transferMatches",
  taxLots: "taxLots",
  taxableEvents: "taxableEvents",
  reviewItems: "reviewItems",
  auditLog: "auditLog",
} as const;

// The single project for this app. Hard-coded so we never juggle ids.
export const PROJECT_ID = "tax-2025";
