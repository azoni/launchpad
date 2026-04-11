// Solana / Phantom wallet fetcher (STUB).
//
// Future plan: use Helius Enhanced Transactions API to pull parsed history,
// produce raw rows, and store them in Firestore as rawTransactions.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: true,
      stub: true,
      message:
        "Solana wallet fetcher is stubbed in v1. Use CSV upload, or wire up Helius here.",
      rows: [],
    }),
  };
};
