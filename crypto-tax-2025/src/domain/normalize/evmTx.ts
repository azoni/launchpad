// EVM transaction normalizer (STUB).
//
// In v1 we don't actually fetch from chain. Real fetchers (Etherscan v2,
// Alchemy, etc.) plug in via netlify/functions/fetch-evm-wallet and write
// rawTransactions docs in the same shape; this normalizer can then ingest
// them. For now we accept a generic "evm tx" payload and produce a normalized
// row that lands in the review queue.

import type { NormalizedTransaction, RawTransaction } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function normalizeEvmRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;

  const timestamp = Number(r.timestamp ?? r.timeStamp ?? 0) * (Number(r.timestamp ?? 0) > 1e12 ? 1 : 1000);
  return {
    id: rawId,
    projectId: PROJECT_ID,
    timestamp: timestamp || 0,
    platform: (r.chain === "abstract" ? "abstract" : "metamask") as NormalizedTransaction["platform"],
    walletId: null,
    walletAddress: (r.from as string) ?? null,
    txType: "unknown",
    assetSent: (r.assetSent as string) ?? null,
    amountSent: (r.amountSent as number) ?? null,
    assetReceived: (r.assetReceived as string) ?? null,
    amountReceived: (r.amountReceived as number) ?? null,
    feeAsset: "ETH",
    feeAmount: (r.gasFee as number) ?? null,
    usdValue: (r.usdValue as number) ?? null,
    txHash: (r.hash as string) ?? null,
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: 0.2,
    reviewStatus: "needs_review",
  };
}
