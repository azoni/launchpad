// NFT detection. Heuristic for v1: look at the asset name + tx hash + amount
// to flag obvious NFT activity. We don't try to resolve collections from
// chain — that's a v2 concern.

import type { NormalizedTransaction } from "../../types";

export function isNftRow(t: NormalizedTransaction): boolean {
  if (t.txType.startsWith("nft_")) return true;
  const asset = t.assetReceived ?? t.assetSent ?? "";
  if (/#\d+|\bnft\b|opensea|magic\s*eden/i.test(asset)) return true;
  // Round quantity of 1 with non-fungible-looking asset names
  if ((t.amountReceived === 1 || t.amountSent === 1) && /[A-Za-z]{4,}/.test(asset)) {
    return /collection|punks|apes|mfers|frens/i.test(asset);
  }
  return false;
}
