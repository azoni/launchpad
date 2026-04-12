// Coinbase CSV parser. Handles the real export format from Coinbase including:
//   - Header junk lines before the actual CSV
//   - Dollar signs in numeric fields ($87,849.29)
//   - Negative quantities for sends/sells (-168.289)
//   - ID column at the start
//   - All transaction types: Buy, Sell, Send, Receive, Convert,
//     Credit Card Reward, Reward Income, Staking Income, Withdrawal,
//     Deposit, Credit Card Balance Payment, Retail Simple Dust,
//     Admin Debit, Retail Unstaking Transfer, Advanced Trade Buy/Sell

import Papa from "papaparse";
import type { NormalizedTransaction, RawTransaction, TxType } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function parseCoinbaseCsv(text: string): Array<Record<string, unknown>> {
  const lines = text.split("\n");
  let startIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    if (/timestamp/i.test(lines[i])) {
      startIdx = i;
      break;
    }
  }
  const csvBody = lines.slice(startIdx).join("\n");

  const result = Papa.parse<Record<string, unknown>>(csvBody, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // Keep as strings — we'll parse manually to handle $ signs
  });
  return (result.data ?? []).filter((r) => r && typeof r === "object");
}

// Strip $ signs and commas, then parse as number
function money(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).replace(/[$,]/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseTs(v: unknown): number {
  if (typeof v === "number") return v > 1e12 ? v : v * 1000;
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v).trim();
}

const TYPE_MAP: Record<string, TxType> = {
  // Core
  "buy": "buy",
  "sell": "sell",
  "send": "transfer_out",
  "receive": "transfer_in",
  "convert": "swap",
  // Rewards & income
  "credit card reward": "income",
  "reward income": "income",
  "staking income": "income",
  "coinbase earn": "income",
  "learning reward": "income",
  "rewards income": "income",
  // Advanced Trade
  "advanced trade buy": "buy",
  "advanced trade sell": "sell",
  // Non-taxable / ignorable
  "deposit": "transfer_in",
  "withdrawal": "transfer_out",
  "credit card balance payment": "fee",
  "retail unstaking transfer": "transfer_in", // internal move, non-taxable
  "retail simple dust": "spam",
  // Admin (clawbacks, corrections)
  "admin debit": "transfer_out",
  "admin credit": "transfer_in",
};

export function normalizeCoinbaseRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;

  // Build a case-insensitive lookup. Strip parens and slashes for verbose headers.
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(r)) lower[k.toLowerCase().replace(/[\s_\-()\/]/g, "")] = r[k];

  const timestamp = parseTs(lower["timestamp"] ?? lower["time"] ?? lower["date"]);
  const txTypeRaw = str(lower["transactiontype"] ?? lower["type"] ?? "")?.toLowerCase() ?? "";
  const asset = str(lower["asset"] ?? lower["currency"] ?? lower["coin"]);
  const rawQty = money(lower["quantitytransacted"] ?? lower["quantity"] ?? lower["amount"]);
  const quantity = rawQty !== null ? Math.abs(rawQty) : null;
  const spotPrice = money(lower["priceattransaction"] ?? lower["spotpriceattransaction"] ?? lower["spotprice"] ?? lower["price"]);
  const subtotal = money(lower["subtotal"]);
  const total = money(lower["totalinclusiveoffeesandorspread"] ?? lower["total"]);
  const fees = money(lower["feesandorspread"] ?? lower["fees"] ?? lower["fee"]);
  const notes = str(lower["notes"] ?? lower["note"]) ?? "";

  // Map transaction type
  let txType: TxType = TYPE_MAP[txTypeRaw] ?? "unknown";

  // Skip USD deposits (not crypto activity)
  if ((txTypeRaw === "deposit" || txTypeRaw === "withdrawal") && asset === "USD") {
    // USD bank transfers are not crypto transactions
    return {
      id: rawId,
      projectId: PROJECT_ID,
      timestamp,
      platform: "coinbase",
      walletId: null,
      walletAddress: null,
      txType: "transfer_in",
      assetSent: null,
      amountSent: null,
      assetReceived: "USD",
      amountReceived: quantity,
      feeAsset: null,
      feeAmount: null,
      usdValue: null, // USD deposits aren't taxable
      txHash: null,
      sourceId: raw.sourceId,
      sourceRowRef: raw.id,
      confidenceScore: 0.95,
      reviewStatus: "ok",
      notes: `${txTypeRaw} — USD bank transfer (non-taxable)`,
    };
  }

  // Set up asset directions
  let assetReceived = asset;
  let amountReceived = quantity;
  let assetSent: string | null = null;
  let amountSent: number | null = null;

  // Convert: parse "Converted X ETH to Y USDC" from notes
  if (txType === "swap" && notes) {
    const match = notes.match(/converted\s+([\d.]+)\s+(\w+)\s+to\s+([\d.]+)\s+(\w+)/i);
    if (match) {
      assetSent = match[2];
      amountSent = Number(match[1]);
      assetReceived = match[4];
      amountReceived = Number(match[3]);
    }
  }

  // Sells and sends: asset goes out
  if (txType === "sell" || txType === "transfer_out") {
    assetSent = asset;
    amountSent = quantity;
    assetReceived = null;
    amountReceived = null;
  }

  // USD value logic:
  // - Buy/income: use Total (includes fees → correct IRS basis)
  // - Sell: use Subtotal (before fees → correct IRS proceeds)
  // - Swap: use Total
  // - Transfer: use spot price * qty for reference
  // - Fallback: compute from spot price
  let usdValue: number | null = null;
  if (txType === "buy" || txType === "income") {
    usdValue = total ?? subtotal ?? (spotPrice && quantity ? spotPrice * quantity : null);
  } else if (txType === "sell") {
    usdValue = subtotal ?? total ?? (spotPrice && quantity ? spotPrice * quantity : null);
  } else if (txType === "swap") {
    usdValue = total ?? subtotal ?? (spotPrice && quantity ? spotPrice * quantity : null);
  } else if (txType === "transfer_in" || txType === "transfer_out") {
    // Transfers aren't taxable, but USD value is useful for display
    usdValue = spotPrice && quantity ? spotPrice * quantity : (subtotal ?? total ?? null);
  } else {
    usdValue = total ?? subtotal ?? (spotPrice && quantity ? spotPrice * quantity : null);
  }
  // Take absolute value — Coinbase uses negative for outflows
  if (usdValue !== null) usdValue = Math.abs(usdValue);

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
    feeAmount: fees ? Math.abs(fees) : null,
    usdValue,
    txHash: null,
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: confidence,
    reviewStatus: txType === "unknown" ? "needs_review" : "ok",
    notes: txType === "income" ? `${txTypeRaw} ${notes}`.trim() : (notes || undefined),
  };
}
