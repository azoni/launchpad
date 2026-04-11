// Hyperliquid CSV parser. Hyperliquid exports a few different shapes; we
// recognize the most common headers and produce normalized rows tagged as
// perp_close (with realized PnL) or fees. Anything we can't classify cleanly
// passes through as `unknown` so the review queue catches it.

import Papa from "papaparse";
import type { NormalizedTransaction, RawTransaction } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

export function parseHyperliquidCsv(text: string): Array<Record<string, unknown>> {
  const result = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  return (result.data ?? []).filter((r) => r && typeof r === "object");
}

function parseTimestamp(v: unknown): number {
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

export function normalizeHyperliquidRow(
  raw: RawTransaction,
  rawId: string
): NormalizedTransaction | null {
  const r = raw.rawPayload as Record<string, unknown>;

  // Hyperliquid headers we care about (case-insensitive lookup):
  // time, coin, dir, ntl, fee, closedPnl, hash, side
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(r)) lower[k.toLowerCase()] = r[k];

  const timestamp = parseTimestamp(lower["time"] ?? lower["timestamp"] ?? lower["date"]);
  const coin = str(lower["coin"] ?? lower["asset"] ?? lower["symbol"]);
  const closedPnl = num(lower["closedpnl"] ?? lower["pnl"] ?? lower["realizedpnl"]);
  const fee = num(lower["fee"]);
  const ntl = num(lower["ntl"] ?? lower["notional"] ?? lower["size"]);
  const dir = str(lower["dir"] ?? lower["side"] ?? lower["direction"]);

  // Decide tx type
  let txType: NormalizedTransaction["txType"] = "unknown";
  if (closedPnl !== null && closedPnl !== 0) {
    txType = "realized_pnl";
  } else if (dir && /open/i.test(dir)) {
    txType = "perp_open";
  } else if (dir && /close/i.test(dir)) {
    txType = "perp_close";
  } else if (fee !== null && fee !== 0 && closedPnl === null && ntl === null) {
    txType = "fee";
  }

  return {
    id: rawId,
    projectId: PROJECT_ID,
    timestamp,
    platform: "hyperliquid",
    walletId: null,
    walletAddress: null,
    txType,
    assetSent: null,
    amountSent: null,
    assetReceived: coin,
    amountReceived: ntl,
    feeAsset: fee !== null && fee !== 0 ? "USDC" : null,
    feeAmount: fee,
    usdValue: closedPnl !== null ? closedPnl : ntl,
    txHash: str(lower["hash"] ?? lower["txhash"] ?? lower["tx_hash"]),
    sourceId: raw.sourceId,
    sourceRowRef: raw.id,
    confidenceScore: txType === "unknown" ? 0.3 : 0.85,
    reviewStatus: txType === "unknown" ? "needs_review" : "ok",
  };
}
