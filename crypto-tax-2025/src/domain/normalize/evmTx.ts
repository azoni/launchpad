// EVM transaction normalizer. Handles rows from the Etherscan/Blockscout fetcher.
// Row types:
//   "normal" — ETH transfer or contract call (has direction, amount, gasFee)
//   "swap" — DEX swap detected by correlating normal tx + token transfers
//            (has assetSent, amountSent, assetReceived, amountReceived)
//   "token_transfer" — ERC-20 transfer (has asset, amount, direction)
//   "internal" — internal ETH transfer (has asset, amount, direction)

import type { NormalizedTransaction, RawTransaction, TxType } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function normalizeEvmRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;

  const rowType = (r.type as string) ?? "normal";
  const timestamp = Number(r.timestamp ?? 0);
  const hash = (r.hash as string) ?? null;
  const from = (r.from as string) ?? null;
  const to = (r.to as string) ?? null;
  const gasFee = Number(r.gasFee ?? 0);
  const functionName = (r.functionName as string) ?? "";

  // Handle swap rows (fetcher already paired normal tx + token transfer)
  if (rowType === "swap") {
    const assetSent = (r.assetSent as string) ?? null;
    const amountSent = Number(r.amountSent ?? 0);
    const assetReceived = (r.assetReceived as string) ?? null;
    const amountReceived = Number(r.amountReceived ?? 0);

    if (amountSent === 0 && amountReceived === 0) return null;

    return {
      id: rawId,
      projectId: PROJECT_ID,
      timestamp,
      platform: (r.chain === "abstract" ? "abstract" : "metamask"),
      walletId: null,
      walletAddress: from,
      txType: "swap",
      assetSent,
      amountSent: amountSent || null,
      assetReceived,
      amountReceived: amountReceived || null,
      feeAsset: gasFee > 0 ? "ETH" : null,
      feeAmount: gasFee > 0 ? gasFee : null,
      usdValue: null,
      txHash: hash,
      sourceId: raw.sourceId,
      sourceRowRef: raw.id,
      confidenceScore: 0.8,
      reviewStatus: "needs_review",
      notes: functionName ? `DEX swap: ${functionName}` : "DEX swap",
    };
  }

  // Handle normal, token_transfer, and internal rows
  const asset = (r.asset as string) ?? "ETH";
  const amount = Number(r.amount ?? 0);
  const direction = (r.direction as string) ?? "in";

  // Skip zero-value rows that aren't contract interactions
  if (amount === 0 && gasFee === 0 && !functionName) return null;

  // For token transfers and internal txs, amount should be > 0
  if ((rowType === "token_transfer" || rowType === "internal") && amount === 0) return null;

  let txType: TxType = "unknown";
  let confidence = 0.7;

  if (direction === "out") {
    txType = "transfer_out";
    confidence = 0.8;
    if (/swap|exchange|trade/i.test(functionName)) {
      txType = "swap";
      confidence = 0.75;
    }
  } else {
    txType = "transfer_in";
    confidence = 0.8;
  }

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
    amountSent: direction === "out" && amount > 0 ? amount : null,
    assetReceived: direction === "in" ? asset : null,
    amountReceived: direction === "in" && amount > 0 ? amount : null,
    feeAsset: gasFee > 0 ? "ETH" : null,
    feeAmount: gasFee > 0 ? gasFee : null,
    usdValue: null,
    txHash: hash,
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: confidence,
    reviewStatus: "needs_review",
    notes: functionName ? `Contract call: ${functionName}` : undefined,
  };
}
