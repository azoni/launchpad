// Spam / dust / junk-token heuristics. Conservative — flags items into the
// review queue, never silently deletes.

import type { NormalizedTransaction } from "../../types";

const KNOWN_SPAM_PATTERNS = [
  /airdrop/i,
  /claim.*\.com/i,
  /visit.*site/i,
  /\$\d/, // tickers like "$CLAIMME"
  /^[A-Z0-9]{20,}$/, // suspicious all-caps long token names
];

const DUST_USD_THRESHOLD = 1.0; // < $1 → dust bucket

export function isLikelySpam(t: NormalizedTransaction): boolean {
  const asset = t.assetReceived ?? "";
  if (KNOWN_SPAM_PATTERNS.some((re) => re.test(asset))) return true;
  return false;
}

export function isDust(t: NormalizedTransaction): boolean {
  if (t.usdValue === null || t.usdValue === undefined) return false;
  return Math.abs(t.usdValue) < DUST_USD_THRESHOLD;
}
