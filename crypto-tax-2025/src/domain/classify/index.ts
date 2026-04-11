// Top-level classifier. Runs after normalize. Mutates a copy of the
// normalized transactions, applying transfer matches, spam detection, and
// NFT tagging. Returns the updated tx list plus the transfer matches.

import type {
  NormalizedTransaction,
  TransferMatch,
  Wallet,
} from "../../types";
import { detectTransferMatches } from "./transferMatch";
import { isLikelySpam, isDust } from "./spamDetect";
import { isNftRow } from "./nftDetect";

export function classifyAll(
  txs: NormalizedTransaction[],
  wallets: Wallet[]
): { txs: NormalizedTransaction[]; transferMatches: TransferMatch[] } {
  const out = txs.map((t) => ({ ...t }));

  // 1) Transfer matching across owned wallets
  const matches = detectTransferMatches(out, wallets);
  const matchedOut = new Set(matches.map((m) => m.outgoingTxId));
  const matchedIn = new Set(matches.map((m) => m.incomingTxId));

  for (const t of out) {
    if (matchedOut.has(t.id)) {
      t.txType = "transfer_out";
      t.reviewStatus = "ok";
      t.confidenceScore = Math.max(t.confidenceScore, 0.9);
    } else if (matchedIn.has(t.id)) {
      t.txType = "transfer_in";
      t.reviewStatus = "ok";
      t.confidenceScore = Math.max(t.confidenceScore, 0.9);
    }
  }

  // 2) Spam tagging
  for (const t of out) {
    if (t.txType !== "transfer_in" && t.txType !== "transfer_out" && isLikelySpam(t)) {
      t.txType = "spam";
      t.reviewStatus = "needs_review";
      t.notes = (t.notes ?? "") + " [auto: spam pattern]";
    }
  }

  // 3) NFT tagging — refines unknown -> nft_*
  for (const t of out) {
    if (t.txType === "unknown" && isNftRow(t)) {
      t.txType = "nft_transfer";
      t.reviewStatus = "needs_review";
      t.notes = (t.notes ?? "") + " [auto: looks like NFT]";
    }
  }

  // 4) Dust flag — leave txType alone but mark for bulk review
  for (const t of out) {
    if (isDust(t) && t.txType !== "transfer_in" && t.txType !== "transfer_out") {
      if (t.reviewStatus === "ok") t.reviewStatus = "needs_review";
      t.notes = (t.notes ?? "") + " [dust]";
    }
  }

  return { txs: out, transferMatches: matches };
}
