// Coinbase CSV parser. Coinbase transaction history exports use this shape:
//
//   Timestamp, Transaction Type, Asset, Quantity Transacted,
//   Spot Price Currency, Spot Price at Transaction, Subtotal,
//   Total (inclusive of fees and/or spread), Fees and/or Spread, Notes
//
// Transaction types we map:
//   Buy → buy (opens a lot at Total as basis)
//   Sell → sell (proceeds = Subtotal, fees deducted)
//   Send → transfer_out
//   Receive → transfer_in
//   Convert → swap (sell sent + buy received)
//   Coinbase Earn / Learning Reward / Staking Income / Rewards Income → income
//   Advanced Trade Buy/Sell → buy/sell

import Papa from "papaparse";
import type { NormalizedTransaction, RawTransaction, TxType } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function parseCoinbaseCsv(text: string): Array<Record<string, unknown>> {
  // Coinbase CSVs sometimes have header rows before the actual CSV.
  // Strip lines until we find the header row containing "Timestamp".
  const lines = text.split("\n");
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (/timestamp/i.test(lines[i])) {
      startIdx = i;
      break;
    }
  }
  const csvBody = lines.slice(startIdx).join("\n");

  const result = Papa.parse<Record<string, unknown>>(csvBody, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return (result.data ?? []).filter((r) => r && typeof r === "object");
}

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

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v).trim();
}

const TYPE_MAP: Record<string, TxType> = {
  buy: "buy",
  sell: "sell",
  send: "transfer_out",
  receive: "transfer_in",
  convert: "swap",
  "advanced trade buy": "buy",
  "advanced trade sell": "sell",
  "coinbase earn": "income",
  "learning reward": "income",
  "staking income": "income",
  "rewards income": "income",
  reward: "income",
  inflation_reward: "income",
};

export function normalizeCoinbaseRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;

  // Build a case-insensitive lookup. Strip spaces, underscores, hyphens,
  // parentheses, and slashes to handle Coinbase's verbose headers like
  // "Total (inclusive of fees and/or spread)" → "totalinclusiveoffeesandorspread"
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(r)) lower[k.toLowerCase().replace(/[\s_\-()\/]/g, "")] = r[k];

  const timestamp = parseTs(
    lower["timestamp"] ?? lower["time"] ?? lower["date"]
  );
  const txTypeRaw = str(lower["transactiontype"] ?? lower["type"] ?? "")?.toLowerCase() ?? "";
  const asset = str(lower["asset"] ?? lower["currency"] ?? lower["coin"]);
  const quantity = num(lower["quantitytransacted"] ?? lower["quantity"] ?? lower["amount"]);
  const spotPrice = num(lower["spotpriceattransaction"] ?? lower["spotprice"] ?? lower["price"]);
  const subtotal = num(lower["subtotal"]);
  const total = num(lower["total"] ?? lower["totalinclusiveoffeesandorspread"]);
  const fees = num(lower["feesandorspread"] ?? lower["fees"] ?? lower["fee"]);
  const notes = str(lower["notes"] ?? lower["note"]) ?? "";

  // Map transaction type
  let txType: TxType = TYPE_MAP[txTypeRaw] ?? "unknown";

  // For Convert, Coinbase puts "Converted X to Y" in the Notes field.
  // The row only has the "from" side. We treat it as a swap.
  let assetReceived = asset;
  let amountReceived = quantity;
  let assetSent: string | null = null;
  let amountSent: number | null = null;

  if (txType === "swap" && notes) {
    // Parse "Converted 0.5 ETH to 1000 USDC" from notes
    const match = notes.match(/converted\s+([\d.]+)\s+(\w+)\s+to\s+([\d.]+)\s+(\w+)/i);
    if (match) {
      assetSent = match[2];
      amountSent = Number(match[1]);
      assetReceived = match[4];
      amountReceived = Number(match[3]);
    }
  }

  if (txType === "sell" || txType === "transfer_out") {
    assetSent = asset;
    amountSent = quantity;
    assetReceived = null;
    amountReceived = null;
  }

  // USD value: use Total for buys (what you actually paid including fees),
  // Subtotal for sells (what you received before fees).
  // This matches IRS treatment: basis includes fees, proceeds exclude fees.
  let usdValue: number | null = null;
  if (txType === "buy" || txType === "income") {
    usdValue = total ?? subtotal ?? (spotPrice && quantity ? spotPrice * quantity : null);
  } else if (txType === "sell") {
    usdValue = subtotal ?? total ?? (spotPrice && quantity ? spotPrice * quantity : null);
  } else if (txType === "swap") {
    usdValue = total ?? subtotal ?? (spotPrice && quantity ? spotPrice * quantity : null);
  } else {
    usdValue = total ?? subtotal ?? (spotPrice && quantity ? spotPrice * quantity : null);
  }

  const confidence = txType === "unknown" ? 0.3 : 0.9;

  return {
    id: rawId,
    projectId: PROJECT_ID,
    timestamp,
    platform: "coinbase",
    walletId: null,
    walletAddress: null,
    txType,
    assetSent,
    amountSent,
    assetReceived,
    amountReceived,
    feeAsset: fees && fees > 0 ? "USD" : null,
    feeAmount: fees,
    usdValue,
    txHash: null,
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: confidence,
    reviewStatus: txType === "unknown" ? "needs_review" : "ok",
    notes: txType === "income" ? `${txTypeRaw} ${notes}`.trim() : notes || undefined,
  };
}
