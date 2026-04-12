// Deterministic FIFO cost-basis engine. Source of truth for every dollar.
//
// Now includes:
//  - income (staking, airdrops): creates a tax lot at FMV + records income event
//  - Form 8949 box codes: C (short, no 1099-B) or F (long, no 1099-B)
//    for crypto — Box B/E if a 1099-B was received (rare for DeFi)
//  - Wash sale detection: if a loss disposal is followed by a repurchase of
//    the same asset within 30 days, the loss is disallowed and added to the
//    replacement lot's basis

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
  incomeEvents: IncomeEvent[];
  warnings: Array<{ txId: string; reason: string }>;
}

export interface IncomeEvent {
  id: string;
  date: number;
  asset: string;
  quantity: number;
  fairMarketValueUsd: number;
  source: string; // "staking", "airdrop", etc.
  platform: string;
  txHash: string | null;
  normalizedTxId: string;
}

interface OpenLot {
  id: string;
  asset: string;
  acquiredAt: number;
  qty: number;
  basisUsd: number;
  sourceTxId: string;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

function categoryFor(t: NormalizedTransaction): "spot" | "nft" | "perp" | "income" {
  if (t.txType === "income") return "income";
  if (t.txType.startsWith("nft_")) return "nft";
  if (isPerpRealized(t) || t.txType.startsWith("perp_")) return "perp";
  return "spot";
}

// 1099-DA reported (Coinbase) → Box A (short) or D (long)
// No 1099 (DeFi, self-custody) → Box C (short) or F (long)
function box8949(hp: "short" | "long", platform: string): "A" | "C" | "D" | "F" {
  const reported = platform === "coinbase";
  if (hp === "short") return reported ? "A" : "C";
  return reported ? "D" : "F";
}

function makeEvent(
  t: NormalizedTransaction,
  dateAcquired: number,
  dateSold: number,
  asset: string,
  quantity: number,
  proceeds: number,
  basis: number,
  notes?: string
): TaxableEvent {
  const hp = holdingPeriod(dateAcquired, dateSold);
  const gain = proceeds - basis;
  return {
    id: crypto.randomUUID(),
    projectId: PROJECT_ID,
    normalizedTxId: t.id,
    dateAcquired,
    dateSold,
    asset,
    quantity,
    proceedsUsd: proceeds,
    costBasisUsd: basis,
    gainLossUsd: gain,
    holdingPeriod: hp,
    category: categoryFor(t),
    form8949Box: box8949(hp, t.platform),
    washSaleDisallowed: 0,
    platform: t.platform,
    walletAddress: t.walletAddress,
    txHash: t.txHash,
    notes,
  };
}

export function runFifo(txs: NormalizedTransaction[]): FifoResult {
  const inventory = new Map<string, OpenLot[]>();
  const events: TaxableEvent[] = [];
  const incomeEvents: IncomeEvent[] = [];
  const warnings: Array<{ txId: string; reason: string }> = [];

  const sorted = txs.slice().sort((a, b) => a.timestamp - b.timestamp);

  for (const t of sorted) {
    if (isNonTaxableTransfer(t)) continue;

    // --- Income (staking, airdrops) ---
    if (t.txType === "income") {
      const asset = t.assetReceived;
      const qty = t.amountReceived ?? 0;
      const fmv = t.usdValue;
      if (!asset || qty <= 0 || fmv === null || fmv === undefined) {
        warnings.push({ txId: t.id, reason: "income row missing asset/qty/fmv" });
        continue;
      }
      // Create a tax lot with basis = FMV at time of receipt
      const lot: OpenLot = {
        id: crypto.randomUUID(),
        asset,
        acquiredAt: t.timestamp,
        qty,
        basisUsd: fmv,
        sourceTxId: t.id,
      };
      const queue = inventory.get(asset) ?? [];
      queue.push(lot);
      inventory.set(asset, queue);
      // Record the income event (for Schedule 1 / Schedule C)
      incomeEvents.push({
        id: crypto.randomUUID(),
        date: t.timestamp,
        asset,
        quantity: qty,
        fairMarketValueUsd: fmv,
        source: (t.notes ?? "").includes("airdrop") ? "airdrop" : "staking",
        platform: t.platform,
        txHash: t.txHash,
        normalizedTxId: t.id,
      });
      continue;
    }

    // --- Perp realized PnL ---
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
        form8949Box: box8949("short", t.platform),
        washSaleDisallowed: 0,
        platform: t.platform,
        walletAddress: t.walletAddress,
        txHash: t.txHash,
      });
      continue;
    }

    // --- Acquisitions (buy, nft_buy, nft_mint) ---
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

    // --- Swaps (sell sent + buy received) ---
    if (t.txType === "swap") {
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

    // --- Disposals (sell, nft_sell) ---
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

    if (t.txType !== "fee" && t.txType !== "bridge" && t.txType !== "spam") {
      warnings.push({ txId: t.id, reason: `unhandled txType: ${t.txType}` });
    }
  }

  // --- Wash sale pass ---
  // For each loss event, check if the same asset was repurchased within 30 days.
  // If so, disallow the loss and add it to the replacement lot's basis.
  for (const ev of events) {
    if (ev.gainLossUsd >= 0) continue; // only losses
    const lossAmt = Math.abs(ev.gainLossUsd);
    // Look for a repurchase of the same asset within 30 days after the sale
    const repurchase = sorted.find(
      (t) =>
        (isAcquisition(t) || t.txType === "swap" || t.txType === "income") &&
        (t.assetReceived?.toLowerCase() === ev.asset.toLowerCase()) &&
        t.timestamp >= ev.dateSold &&
        t.timestamp <= ev.dateSold + THIRTY_DAYS_MS &&
        t.id !== ev.normalizedTxId
    );
    if (repurchase) {
      ev.washSaleDisallowed = lossAmt;
      // Adjust: the disallowed loss gets added to the replacement lot's basis
      const queue = inventory.get(ev.asset) ?? [];
      const replacementLot = queue.find((l) => l.sourceTxId === repurchase.id);
      if (replacementLot) {
        replacementLot.basisUsd += lossAmt;
      }
      ev.notes = (ev.notes ?? "") + ` [WASH SALE: $${lossAmt.toFixed(2)} loss disallowed, basis adjusted on replacement lot]`;
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

  return { lots, taxableEvents: events, incomeEvents, warnings };
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
    const hp = holdingPeriod(lot.acquiredAt, t.timestamp);

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
      gainLossUsd: proceeds - basis,
      holdingPeriod: hp,
      category: cat,
      form8949Box: box8949(hp, t.platform),
      washSaleDisallowed: 0,
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
      form8949Box: box8949("short", t.platform),
      washSaleDisallowed: 0,
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
