// EVM wallet fetcher (STUB).
//
// In v1 we don't actually call Etherscan/Alchemy. The function exists so the
// frontend can call it cleanly and we can wire in real fetching later
// without changing the rest of the pipeline.
//
// Future plan: accept { address, chain } and use Etherscan v2 multichain API
// (one key, all EVM chains incl. Abstract) to fetch tx + token transfer +
// internal tx history. Each row gets written to Firestore as a
// `rawTransactions` doc with sourceId = the matching `dataSources` doc.

import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ok: true,
      stub: true,
      message:
        "EVM wallet fetcher is stubbed in v1. Use CSV upload, or wire up Etherscan v2 here.",
      rows: [],
    }),
  };
};
