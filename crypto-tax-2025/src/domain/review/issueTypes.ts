import type { IssueType } from "../../types";

export const ISSUE_LABELS: Record<IssueType, string> = {
  missing_basis: "Missing cost basis",
  unknown_type: "Unclassified transaction",
  transfer_mismatch: "Possible transfer mismatch",
  possible_bridge: "Possible bridge",
  weird_nft: "Unusual NFT event",
  spam_token: "Suspected spam token",
  junk_dust: "Dust / junk token",
  unresolved_perp: "Unresolved perp row",
  missing_price: "Missing USD price",
  duplicate_candidate: "Possible duplicate",
};

export const ISSUE_PRIORITY: Record<IssueType, number> = {
  missing_basis: 100,
  unknown_type: 90,
  transfer_mismatch: 80,
  unresolved_perp: 70,
  possible_bridge: 60,
  weird_nft: 55,
  missing_price: 50,
  duplicate_candidate: 40,
  spam_token: 20,
  junk_dust: 10,
};
