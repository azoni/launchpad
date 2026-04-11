// Deterministic FIFO cost-basis engine. Source of truth for every dollar.
//
// Inputs: a sorted list of normalized transactions.
// Outputs: tax lots (the inventory state) + taxable events (one per disposed
// quantity slice).
//
// Rules:
//  - buy / transfer_in / nft_buy / nft_mint with usdValue → opens a new lot
//  - sell / swap / nft_sell with usdValue → consumes lots in FIFO order
//  - swap is treated as a sell of asset_sent + a buy of asset_received,
//    using usdValue as both proceeds and new lot basis (the "fair value at
//    swap time" approach the IRS uses)
//  - perp_close / realized_pnl → emit a perp-category taxable event with
//    proceeds = 0, basis = 0, gain_loss = realized_pnl, holding_period = short
//    (perps are always short-term for individuals)
//  - transfer_in / transfer_out are non-taxable (do not move basis between
//    owned wallets, since transfers don't change ownership)
//  - missing usdValue or missing prior basis → no event emitted; the row is
//    flagged in the review queue elsewhere
//
// All math uses plain JS numbers. For 2025 personal use this is fine; if
// rounding issues bite, we can swap in a Decimal lib without changing shape.

import type {
  NormalizedTransaction,
  TaxLot,
  TaxableEvent,
} from "../../types";
import { PROJECT_ID } from "../../lib/collections";
import { holdingPeriod } from "./holdingPeriod";

export interface FifoResult {
  lots: TaxLot[];
  taxableEvents: TaxableEvent[];
  warnings: Array<{ txId: string; reason: string }>;
}

interface OpenLot {
  id: string;
  asset: string;
  acquiredAt: number;
  qty: number;
  basisUsd: number;
  sourceTxId: string;
}

function isAcquisition(t: NormalizedTransaction): boolean {
  return ["buy", "nft_buy", "nft_mint"].includes(t.txType);
}
function isDisposal(t: NormalizedTransaction): boolean {
  return ["sell", "nft_sell"].includes(t.txType);
}
function isPerpRealized(t: NormalizedTransaction): boolean {
  return t.txType === "realized_pnl" || t.txType === "perp_close";
}
function isNonTaxableTransfer(t: NormalizedTransaction): boolean {
  return t.txType === "transfer_in" || t.txType === "transfer_out";
}

function categoryFor(t: NormalizedTransaction): "spot" | "nft" | "perp" {
  if (t.txType.startsWith("nft_")) return "nft";
  if (isPerpRealized(t) || t.txType.startsWith("perp_")) return "perp";
  return "spot";
}

export function runFifo(txs: NormalizedTransaction[]): FifoResult {
  // Inventory: asset -> queue of open lots (oldest first)
  const inventory = new Map<string, OpenLot[]>();
  const events: TaxableEvent[] = [];
  const warnings: Array<{ txId: string; reason: string }> = [];

  // Iterate in chronological order — caller may have sorted, but be defensive.
  const sorted = txs.slice().sort((a, b) => a.timestamp - b.timestamp);

  for (const t of sorted) {
    if (isNonTaxableTransfer(t)) continue;

    if (isPerpRealized(t)) {
      const pnl = t.usdValue ?? 0;
      events.push({
        id: crypto.randomUUID(),
        projectId: PROJECT_ID,
        normalizedTxId: t.id,
        dateAcquired: t.timestamp,
        dateSold: t.timestamp,
        asset: t.assetReceived ?? "PERP",
        quantity: t.amountReceived ?? 0,
        proceedsUsd: pnl > 0 ? pnl : 0,
        costBasisUsd: pnl < 0 ? -pnl : 0,
        gainLossUsd: pnl,
        holdingPeriod: "short",
        category: "perp",
        platform: t.platform,
        walletAddress: t.walletAddress,
        txHash: t.txHash,
      });
      continue;
    }

    if (isAcquisition(t)) {
      const asset = t.assetReceived;
      const qty = t.amountReceived ?? 0;
      const cost = t.usdValue;
      if (!asset || qty <= 0 || cost === null || cost === undefined) {
        warnings.push({ txId: t.id, reason: "acquisition missing asset/qty/usdValue" });
        continue;
      }
      const lot: OpenLot = {
        id: crypto.randomUUID(),
        asset,
        acquiredAt: t.timestamp,
        qty,
        basisUsd: cost,
        sourceTxId: t.id,
      };
      const queue = inventory.get(asset) ?? [];
      queue.push(lot);
      inventory.set(asset, queue);
      continue;
    }

    if (t.txType === "swap") {
      // Treat as sell(assetSent, amountSent, usdValue) + buy(assetReceived, amountReceived, usdValue)
      const sentAsset = t.assetSent;
      const sentAmt = t.amountSent;
      const recvAsset = t.assetReceived;
      const recvAmt = t.amountReceived;
      const fairValue = t.usdValue;

      if (sentAsset && sentAmt && fairValue !== null && fairValue !== undefined) {
        consumeFifo(inventory, sentAsset, sentAmt, fairValue, t, events, warnings);
      } else {
        warnings.push({ txId: t.id, reason: "swap sent-side missing data" });
      }

      if (recvAsset && recvAmt && recvAmt > 0 && fairValue !== null && fairValue !== undefined) {
        const lot: OpenLot = {
          id: crypto.randomUUID(),
          asset: recvAsset,
          acquiredAt: t.timestamp,
          qty: recvAmt,
          basisUsd: fairValue,
          sourceTxId: t.id,
        };
        const queue = inventory.get(recvAsset) ?? [];
        queue.push(lot);
        inventory.set(recvAsset, queue);
      }
      continue;
    }

    if (isDisposal(t)) {
      const asset = t.assetSent ?? t.assetReceived;
      const amt = t.amountSent ?? t.amountReceived;
      const proceeds = t.usdValue;
      if (!asset || amt === null || amt === undefined || amt <= 0 || proceeds === null || proceeds === undefined) {
        warnings.push({ txId: t.id, reason: "disposal missing asset/qty/proceeds" });
        continue;
      }
      consumeFifo(inventory, asset, amt, proceeds, t, events, warnings);
      continue;
    }

    // unknown / spam / fee / bridge — no event, will be reviewed
    if (t.txType !== "fee" && t.txType !== "bridge" && t.txType !== "spam") {
      warnings.push({ txId: t.id, reason: `unhandled txType: ${t.txType}` });
    }
  }

  // Snapshot remaining lots
  const lots: TaxLot[] = [];
  for (const [asset, queue] of inventory.entries()) {
    for (const l of queue) {
      lots.push({
        id: l.id,
        projectId: PROJECT_ID,
        asset,
        acquiredAt: l.acquiredAt,
        quantityRemaining: l.qty,
        costBasisRemaining: l.basisUsd,
        sourceTxId: l.sourceTxId,
      });
    }
  }

  return { lots, taxableEvents: events, warnings };
}

function consumeFifo(
  inventory: Map<string, OpenLot[]>,
  asset: string,
  qtyToSell: number,
  totalProceeds: number,
  t: NormalizedTransaction,
  events: TaxableEvent[],
  warnings: Array<{ txId: string; reason: string }>
) {
  const queue = inventory.get(asset) ?? [];
  let remaining = qtyToSell;
  const proceedsPerUnit = totalProceeds / qtyToSell;
  const cat = categoryFor(t);

  while (remaining > 0 && queue.length > 0) {
    const lot = queue[0];
    const consumed = Math.min(lot.qty, remaining);
    const lotCostPerUnit = lot.basisUsd / lot.qty;
    const basis = lotCostPerUnit * consumed;
    const proceeds = proceedsPerUnit * consumed;
    const gain = proceeds - basis;

    events.push({
      id: crypto.randomUUID(),
      projectId: PROJECT_ID,
      normalizedTxId: t.id,
      dateAcquired: lot.acquiredAt,
      dateSold: t.timestamp,
      asset,
      quantity: consumed,
      proceedsUsd: proceeds,
      costBasisUsd: basis,
      gainLossUsd: gain,
      holdingPeriod: holdingPeriod(lot.acquiredAt, t.timestamp),
      category: cat,
      platform: t.platform,
      walletAddress: t.walletAddress,
      txHash: t.txHash,
    });

    lot.qty -= consumed;
    lot.basisUsd -= basis;
    remaining -= consumed;
    if (lot.qty <= 1e-12) queue.shift();
  }

  if (remaining > 0) {
    // Selling more than we have basis for — emit a "missing basis" event with
    // zero basis (the user will fix it via the review queue) and warn.
    const proceeds = proceedsPerUnit * remaining;
    events.push({
      id: crypto.randomUUID(),
      projectId: PROJECT_ID,
      normalizedTxId: t.id,
      dateAcquired: t.timestamp,
      dateSold: t.timestamp,
      asset,
      quantity: remaining,
      proceedsUsd: proceeds,
      costBasisUsd: 0,
      gainLossUsd: proceeds,
      holdingPeriod: "short",
      category: cat,
      platform: t.platform,
      walletAddress: t.walletAddress,
      txHash: t.txHash,
      notes: "MISSING BASIS — assumed zero. Resolve in Review Queue.",
    });
    warnings.push({
      txId: t.id,
      reason: `disposal of ${remaining} ${asset} has no matching basis`,
    });
  }

  inventory.set(asset, queue);
}
