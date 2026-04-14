// Solana / Phantom normalizer. Handles rows from the Solana RPC fetcher.
// Each row has: type (swap/send/receive), timestamp, hash, asset(s),
// amount(s), fee, account, chain

import type { NormalizedTransaction, RawTransaction, TxType } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function normalizeSolanaRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;

  const timestamp = Number(r.timestamp ?? 0);
  const txTypeRaw = (r.type as string) ?? "unknown";
  const hash = (r.hash as string) ?? null;
  const account = (r.account as string) ?? null;
  const fee = Number(r.fee ?? 0);

  let txType: TxType = "unknown";
  let assetSent: string | null = null;
  let amountSent: number | null = null;
  let assetReceived: string | null = null;
  let amountReceived: number | null = null;
  let confidence = 0.7;

  if (txTypeRaw === "swap") {
    txType = "swap";
    assetSent = (r.assetSent as string) ?? null;
    amountSent = Number(r.amountSent ?? 0);
    assetReceived = (r.assetReceived as string) ?? null;
    amountReceived = Number(r.amountReceived ?? 0);
    confidence = 0.8;
  } else if (txTypeRaw === "receive") {
    txType = "transfer_in";
    assetReceived = (r.asset as string) ?? null;
    amountReceived = Number(r.amount ?? 0);
    confidence = 0.8;
  } else if (txTypeRaw === "send") {
    txType = "transfer_out";
    assetSent = (r.asset as string) ?? null;
    amountSent = Number(r.amount ?? 0);
    confidence = 0.8;
  }

  return {
    id: rawId,
    projectId: PROJECT_ID,
    timestamp,
    platform: "phantom",
    walletId: null,
    walletAddress: account,
    txType,
    assetSent,
    amountSent,
    assetReceived,
    amountReceived,
    feeAsset: fee > 0 ? "SOL" : null,
    feeAmount: fee > 0 ? fee : null,
    usdValue: null, // RPC doesn't include USD prices — will need price lookup or review
    txHash: hash,
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: confidence,
    reviewStatus: "needs_review", // needs_review because no USD value
    notes: txType === "swap"
      ? `Swapped ${amountSent} ${assetSent} → ${amountReceived} ${assetReceived}`
      : undefined,
  };
}
