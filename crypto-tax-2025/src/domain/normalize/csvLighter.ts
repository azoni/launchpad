// Lighter CSV parser. Lighter is a perp DEX; their export gives one row per
// fill plus separate funding rows. We collapse fills into perp_open/perp_close
// rows by side and emit realized_pnl rows where the export already provides
// realized PnL.

import Papa from "papaparse";
import type { NormalizedTransaction, RawTransaction } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function parseLighterCsv(text: string): Array<Record<string, unknown>> {
  const result = Papa.parse<Record<string, unknown>>(text, {
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
  return String(v);
}

export function normalizeLighterRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(r)) lower[k.toLowerCase()] = r[k];

  const timestamp = parseTs(lower["time"] ?? lower["timestamp"] ?? lower["date"]);
  const market = str(lower["market"] ?? lower["symbol"] ?? lower["asset"]);
  const realizedPnl = num(lower["realized_pnl"] ?? lower["realizedpnl"] ?? lower["pnl"]);
  const fee = num(lower["fee"] ?? lower["fees"]);
  const side = str(lower["side"]);
  const size = num(lower["size"] ?? lower["amount"] ?? lower["filled"]);

  let txType: NormalizedTransaction["txType"] = "unknown";
  if (realizedPnl !== null && realizedPnl !== 0) {
    txType = "realized_pnl";
  } else if (side && /buy|long/i.test(side)) {
    txType = "perp_open";
  } else if (side && /sell|short|close/i.test(side)) {
    txType = "perp_close";
  } else if (fee !== null && fee !== 0 && realizedPnl === null) {
    txType = "fee";
  }

  return {
    id: rawId,
    projectId: PROJECT_ID,
    timestamp,
    platform: "lighter",
    walletId: null,
    walletAddress: null,
    txType,
    assetSent: null,
    amountSent: null,
    assetReceived: market,
    amountReceived: size,
    feeAsset: fee !== null && fee !== 0 ? "USDC" : null,
    feeAmount: fee,
    usdValue: realizedPnl !== null ? realizedPnl : size,
    txHash: str(lower["hash"] ?? lower["txhash"]),
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: txType === "unknown" ? 0.3 : 0.8,
    reviewStatus: txType === "unknown" ? "needs_review" : "ok",
  };
}
