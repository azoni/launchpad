// Shared types — pure data shapes only. No methods, no React, no Firestore.

export type ChainId = "ethereum" | "abstract" | "solana" | "other";

export type Platform =
  | "metamask"
  | "phantom"
  | "abstract"
  | "hyperliquid"
  | "lighter"
  | "nft"
  | "manual"
  | "unknown";

export type SourceType =
  | "evm_wallet"
  | "solana_wallet"
  | "hyperliquid_csv"
  | "lighter_csv"
  | "generic_csv";

export type TxType =
  | "buy"
  | "sell"
  | "swap"
  | "transfer_in"
  | "transfer_out"
  | "bridge"
  | "fee"
  | "nft_buy"
  | "nft_sell"
  | "nft_transfer"
  | "nft_mint"
  | "perp_open"
  | "perp_close"
  | "realized_pnl"
  | "income"
  | "spam"
  | "unknown";

export type ReviewStatus = "ok" | "needs_review" | "ignored" | "resolved";

export type IssueType =
  | "missing_basis"
  | "unknown_type"
  | "transfer_mismatch"
  | "possible_bridge"
  | "weird_nft"
  | "spam_token"
  | "junk_dust"
  | "unresolved_perp"
  | "missing_price"
  | "duplicate_candidate"
  | "wash_sale";

export type ReviewItemStatus = "open" | "resolved" | "ignored";

export interface Project {
  id: string;
  name: string;
  taxYear: 2025;
  basisMethod: "fifo";
  ownerUid: string;
  createdAt: number;
  updatedAt: number;
}

export interface Wallet {
  id: string;
  projectId: string;
  address: string;
  chain: ChainId;
  label: string;
  isOwned: boolean;
  createdAt: number;
}

export interface DataSource {
  id: string;
  projectId: string;
  type: SourceType;
  name: string;
  uploadStatus: "pending" | "uploaded" | "parsed" | "error";
  storagePath?: string;
  metadata?: Record<string, unknown>;
  rowCount?: number;
  errorMessage?: string;
  createdAt: number;
}

export interface RawTransaction {
  id: string;
  projectId: string;
  sourceId: string;
  rawPayload: Record<string, unknown>;
  importedAt: number;
}

export interface NormalizedTransaction {
  id: string;
  projectId: string;
  timestamp: number; // unix ms
  platform: Platform;
  walletId: string | null;
  walletAddress: string | null;
  txType: TxType;
  assetSent: string | null;
  amountSent: number | null;
  assetReceived: string | null;
  amountReceived: number | null;
  feeAsset: string | null;
  feeAmount: number | null;
  usdValue: number | null;
  txHash: string | null;
  sourceId: string;
  sourceRowRef: string | null;
  confidenceScore: number; // 0..1
  reviewStatus: ReviewStatus;
  notes?: string;
}

export interface TransferMatch {
  id: string;
  projectId: string;
  outgoingTxId: string;
  incomingTxId: string;
  asset: string;
  amount: number;
  confidenceScore: number;
  status: "candidate" | "confirmed" | "rejected";
  notes?: string;
}

export interface TaxLot {
  id: string;
  projectId: string;
  asset: string;
  acquiredAt: number;
  quantityRemaining: number;
  costBasisRemaining: number; // USD
  sourceTxId: string;
}

export interface TaxableEvent {
  id: string;
  projectId: string;
  normalizedTxId: string;
  dateAcquired: number;
  dateSold: number;
  asset: string;
  quantity: number;
  proceedsUsd: number;
  costBasisUsd: number;
  gainLossUsd: number;
  holdingPeriod: "short" | "long";
  category: "spot" | "nft" | "perp" | "income";
  form8949Box: "B" | "C" | "E" | "F"; // B/C short-term, E/F long-term; C/F = no 1099-B (most crypto)
  washSaleDisallowed: number; // USD amount of loss disallowed by wash sale rule
  platform: Platform;
  walletAddress: string | null;
  txHash: string | null;
  notes?: string;
}

export interface ReviewItem {
  id: string;
  projectId: string;
  transactionId: string | null;
  issueType: IssueType;
  issueSummary: string;
  suggestedResolution: string;
  llmExplanation?: string;
  userResolution?: string;
  status: ReviewItemStatus;
  impactUsd: number;
  createdAt: number;
  resolvedAt?: number;
}

export interface AuditLogEntry {
  id: string;
  projectId: string;
  actionType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  createdAt: number;
  createdBy: string;
}
