// Transfer matching: pair an outgoing tx with a corresponding incoming tx.
//
// Strategy:
// 1. Classic: outgoing from one owned wallet, incoming at another owned wallet
//    (same asset, similar amount, within time window)
// 2. Cross-platform: Coinbase "Send" matched with on-chain "Receive"
//    (Coinbase sends have walletAddress = destination, on-chain receives
//    have walletAddress = same destination — match by txType direction)

import type { NormalizedTransaction, TransferMatch, Wallet } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

const TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour (wider for cross-chain)
const AMOUNT_TOLERANCE = 0.05; // 5% — accommodates fees + gas

export function detectTransferMatches(
  txs: NormalizedTransaction[],
  wallets: Wallet[]
): TransferMatch[] {
  const ownedAddresses = new Set(
    wallets.filter((w) => w.isOwned).map((w) => w.address.toLowerCase())
  );

  const matches: TransferMatch[] = [];
  const used = new Set<string>();

  // Find all outgoing transfers (transfer_out, send)
  const outgoing = txs.filter((t) =>
    t.txType === "transfer_out" &&
    !used.has(t.id) &&
    (t.assetSent ?? t.assetReceived) &&
    Math.abs(t.amountSent ?? t.amountReceived ?? 0) > 0
  );

  // Find all incoming transfers (transfer_in, receive)
  const incoming = txs.filter((t) =>
    t.txType === "transfer_in" &&
    !used.has(t.id) &&
    (t.assetReceived ?? t.assetSent) &&
    Math.abs(t.amountReceived ?? t.amountSent ?? 0) > 0
  );

  for (const out of outgoing) {
    if (used.has(out.id)) continue;
    const outAsset = (out.assetSent ?? out.assetReceived ?? "").toLowerCase();
    const outAmt = Math.abs(out.amountSent ?? out.amountReceived ?? 0);
    if (!outAsset || outAmt === 0) continue;

    for (const inn of incoming) {
      if (used.has(inn.id)) continue;
      if (inn.id === out.id) continue;

      const inAsset = (inn.assetReceived ?? inn.assetSent ?? "").toLowerCase();
      if (outAsset !== inAsset) continue;

      const inAmt = Math.abs(inn.amountReceived ?? inn.amountSent ?? 0);
      if (inAmt === 0) continue;

      // Amount within tolerance
      const diff = Math.abs(outAmt - inAmt) / Math.max(outAmt, inAmt);
      if (diff > AMOUNT_TOLERANCE) continue;

      // Time window
      if (Math.abs(out.timestamp - inn.timestamp) > TIME_WINDOW_MS) continue;

      // Must be different sources or different platforms (not the same tx counted twice)
      if (out.sourceId === inn.sourceId && out.platform === inn.platform) continue;

      matches.push({
        id: crypto.randomUUID(),
        projectId: PROJECT_ID,
        outgoingTxId: out.id,
        incomingTxId: inn.id,
        asset: outAsset.toUpperCase(),
        amount: (outAmt + inAmt) / 2,
        confidenceScore: diff < 0.005 ? 0.95 : diff < 0.02 ? 0.85 : 0.7,
        status: "candidate",
      });
      used.add(out.id);
      used.add(inn.id);
      break;
    }
  }

  return matches;
}
