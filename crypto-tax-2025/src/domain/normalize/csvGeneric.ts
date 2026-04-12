// Generic CSV parser. Used for arbitrary "manual upload" CSVs from sources we
// don't have a dedicated parser for. We map common column names to our schema
// and send anything ambiguous to the review queue.

import Papa from "papaparse";
import type { NormalizedTransaction, RawTransaction, TxType } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function parseGenericCsv(text: string): Array<Record<string, unknown>> {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return (result.data ?? []).filter((r) => r && typeof r === "object");
}

const COLUMN_MAP: Record<string, keyof NormalizedTransaction | "type" | "date"> = {
  date: "date",
  time: "date",
  timestamp: "date",
  type: "type",
  txtype: "type",
  asset: "assetReceived",
  symbol: "assetReceived",
  coin: "assetReceived",
  amount: "amountReceived",
  qty: "amountReceived",
  quantity: "amountReceived",
  size: "amountReceived",
  proceeds: "usdValue",
  usd: "usdValue",
  usdvalue: "usdValue",
  value: "usdValue",
  fee: "feeAmount",
  fees: "feeAmount",
  hash: "txHash",
  txhash: "txHash",
  wallet: "walletAddress",
  address: "walletAddress",
};

function parseTs(v: unknown): number {
  if (typeof v === "number") return v > 1e12 ? v : v * 1000;
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

const TYPE_KEYWORDS: Array<{ re: RegExp; type: TxType }> = [
  { re: /^income$|staking|airdrop|reward|mining/i, type: "income" },
  { re: /buy|purchase/i, type: "buy" },
  { re: /sell|sale/i, type: "sell" },
  { re: /swap|trade/i, type: "swap" },
  { re: /transfer.?in|received|deposit/i, type: "transfer_in" },
  { re: /transfer.?out|sent|withdraw/i, type: "transfer_out" },
  { re: /bridge/i, type: "bridge" },
  { re: /nft.*buy|mint/i, type: "nft_buy" },
  { re: /nft.*sell/i, type: "nft_sell" },
  { re: /nft/i, type: "nft_transfer" },
  { re: /perp/i, type: "perp_close" },
  { re: /pnl|realized/i, type: "realized_pnl" },
  { re: /spam/i, type: "spam" },
  { re: /fee/i, type: "fee" },
];

function detectType(v: unknown): TxType {
  if (v === null || v === undefined) return "unknown";
  const s = String(v);
  for (const { re, type } of TYPE_KEYWORDS) if (re.test(s)) return type;
  return "unknown";
}

export function normalizeGenericRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(r)) lower[k.toLowerCase().replace(/[\s_-]/g, "")] = r[k];

  const timestamp = parseTs(lower["date"] ?? lower["time"] ?? lower["timestamp"]);
  const txType = detectType(lower["type"] ?? lower["txtype"]);

  const tx: NormalizedTransaction = {
    id: rawId,
    projectId: PROJECT_ID,
    timestamp,
    platform: "manual",
    walletId: null,
    walletAddress: (lower["wallet"] ?? lower["address"] ?? null) as string | null,
    txType,
    assetSent: null,
    amountSent: null,
    assetReceived: (lower["asset"] ?? lower["symbol"] ?? lower["coin"] ?? null) as string | null,
    amountReceived: num(lower["amount"] ?? lower["qty"] ?? lower["quantity"] ?? lower["size"]),
    feeAsset: null,
    feeAmount: num(lower["fee"] ?? lower["fees"]),
    usdValue: num(lower["proceeds"] ?? lower["usd"] ?? lower["usdvalue"] ?? lower["value"]),
    txHash: (lower["hash"] ?? lower["txhash"] ?? null) as string | null,
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: txType === "unknown" ? 0.2 : 0.6,
    reviewStatus: txType === "unknown" ? "needs_review" : "ok",
  };

  // Suppress unused-import warning for COLUMN_MAP — kept as documentation.
  void COLUMN_MAP;
  return tx;
}
