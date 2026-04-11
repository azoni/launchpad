// Solana / Phantom normalizer (STUB).
// Same shape as evmTx — designed so a future Helius integration can pipe
// rawTransactions through this without changing the rest of the pipeline.

import type { NormalizedTransaction, RawTransaction } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function normalizeSolanaRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;

  return {
    id: rawId,
    projectId: PROJECT_ID,
    timestamp: Number(r.timestamp ?? 0),
    platform: "phantom",
    walletId: null,
    walletAddress: (r.account as string) ?? null,
    txType: "unknown",
    assetSent: (r.assetSent as string) ?? null,
    amountSent: (r.amountSent as number) ?? null,
    assetReceived: (r.assetReceived as string) ?? null,
    amountReceived: (r.amountReceived as number) ?? null,
    feeAsset: "SOL",
    feeAmount: (r.fee as number) ?? null,
    usdValue: (r.usdValue as number) ?? null,
    txHash: (r.signature as string) ?? null,
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: 0.2,
    reviewStatus: "needs_review",
  };
}
