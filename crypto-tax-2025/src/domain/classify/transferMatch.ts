// Transfer matching: pair an outgoing tx from one owned wallet with an incoming
// tx into another owned wallet. Same asset, similar amount (within fee
// tolerance), same time window. When matched, both rows get reclassified as
// transfer_in / transfer_out (non-taxable) instead of disposals.

import type { NormalizedTransaction, TransferMatch, Wallet } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

const TIME_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const AMOUNT_TOLERANCE = 0.02; // 2% — accommodates fees

export function detectTransferMatches(
  txs: NormalizedTransaction[],
  wallets: Wallet[]
): TransferMatch[] {
  const ownedAddresses = new Set(
    wallets.filter((w) => w.isOwned).map((w) => w.address.toLowerCase())
  );
  if (ownedAddresses.size < 2) return [];

  // Candidates: any tx with a known asset + amount + owned wallet address.
  const candidates = txs.filter((t) => {
    if (!t.walletAddress) return false;
    if (!ownedAddresses.has(t.walletAddress.toLowerCase())) return false;
    const asset = t.assetReceived ?? t.assetSent;
    const amt = t.amountReceived ?? t.amountSent;
    return asset && amt !== null && amt !== undefined;
  });

  const matches: TransferMatch[] = [];
  const used = new Set<string>();

  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];
    if (used.has(a.id)) continue;
    const aAsset = (a.assetSent ?? a.assetReceived)!;
    const aAmt = Math.abs((a.amountSent ?? a.amountReceived ?? 0));
    if (aAmt === 0) continue;

    for (let j = i + 1; j < candidates.length; j++) {
      const b = candidates[j];
      if (used.has(b.id)) continue;
      if (a.walletAddress?.toLowerCase() === b.walletAddress?.toLowerCase()) continue;

      const bAsset = (b.assetReceived ?? b.assetSent)!;
      if (aAsset.toLowerCase() !== bAsset.toLowerCase()) continue;

      const bAmt = Math.abs(b.amountReceived ?? b.amountSent ?? 0);
      if (bAmt === 0) continue;

      const diff = Math.abs(aAmt - bAmt) / Math.max(aAmt, bAmt);
      if (diff > AMOUNT_TOLERANCE) continue;

      if (Math.abs(a.timestamp - b.timestamp) > TIME_WINDOW_MS) continue;

      // We've got a candidate match.
      const outgoingFirst = a.timestamp <= b.timestamp;
      const out = outgoingFirst ? a : b;
      const inn = outgoingFirst ? b : a;

      matches.push({
        id: crypto.randomUUID(),
        projectId: PROJECT_ID,
        outgoingTxId: out.id,
        incomingTxId: inn.id,
        asset: aAsset,
        amount: (aAmt + bAmt) / 2,
        confidenceScore: diff < 0.005 ? 0.95 : 0.8,
        status: "candidate",
      });
      used.add(a.id);
      used.add(b.id);
      break;
    }
  }

  return matches;
}
