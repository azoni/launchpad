// EVM transaction normalizer. Handles rows from the Etherscan fetcher.
// Each row has: type, timestamp, hash, from, to, asset, amount, direction,
// gasFee, functionName, chain, contractAddress

import type { NormalizedTransaction, RawTransaction, TxType } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function normalizeEvmRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;

  const timestamp = Number(r.timestamp ?? 0);
  const asset = (r.asset as string) ?? "ETH";
  const amount = Number(r.amount ?? 0);
  const direction = (r.direction as string) ?? "in";
  const gasFee = Number(r.gasFee ?? 0);
  const hash = (r.hash as string) ?? null;
  const from = (r.from as string) ?? null;
  const to = (r.to as string) ?? null;
  const functionName = (r.functionName as string) ?? "";

  if (amount === 0 && gasFee === 0) return null;

  // Classify based on direction + function name
  let txType: TxType = "unknown";
  let confidence = 0.7;

  if (direction === "out") {
    txType = "transfer_out";
    confidence = 0.8;
    // If it's a swap function call, mark as swap
    if (/swap|exchange|trade/i.test(functionName)) {
      txType = "swap";
      confidence = 0.75;
    }
  } else {
    txType = "transfer_in";
    confidence = 0.8;
  }

  // Determine the wallet address (the user's address)
  const walletAddress = direction === "out" ? from : to;

  return {
    id: rawId,
    projectId: PROJECT_ID,
    timestamp,
    platform: (r.chain === "abstract" ? "abstract" : "metamask"),
    walletId: null,
    walletAddress,
    txType,
    assetSent: direction === "out" ? asset : null,
    amountSent: direction === "out" ? amount : null,
    assetReceived: direction === "in" ? asset : null,
    amountReceived: direction === "in" ? amount : null,
    feeAsset: gasFee > 0 ? "ETH" : null,
    feeAmount: gasFee > 0 ? gasFee : null,
    usdValue: null, // Etherscan free API doesn't include USD — price lookup needed
    txHash: hash,
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: confidence,
    reviewStatus: "needs_review", // needs_review because no USD value
    notes: functionName ? `Contract call: ${functionName}` : undefined,
  };
}
