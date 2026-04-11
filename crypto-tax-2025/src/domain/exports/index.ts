// All seven CSV exports build off the same data the UI shows.
// Each exporter takes domain data and returns a CSV string.

import type {
  AuditLogEntry,
  NormalizedTransaction,
  ReviewItem,
  TaxableEvent,
  TransferMatch,
} from "../../types";
import { toCsv, type CsvRow } from "./csv";

export function exportSummaryByCategory(events: TaxableEvent[]): string {
  const buckets: Record<string, { proceeds: number; basis: number; gain: number }> = {
    short_term: { proceeds: 0, basis: 0, gain: 0 },
    long_term: { proceeds: 0, basis: 0, gain: 0 },
    nft: { proceeds: 0, basis: 0, gain: 0 },
    perps: { proceeds: 0, basis: 0, gain: 0 },
  };
  for (const e of events) {
    if (e.category === "perp") {
      buckets.perps.proceeds += e.proceedsUsd;
      buckets.perps.basis += e.costBasisUsd;
      buckets.perps.gain += e.gainLossUsd;
    } else if (e.category === "nft") {
      buckets.nft.proceeds += e.proceedsUsd;
      buckets.nft.basis += e.costBasisUsd;
      buckets.nft.gain += e.gainLossUsd;
    } else if (e.holdingPeriod === "long") {
      buckets.long_term.proceeds += e.proceedsUsd;
      buckets.long_term.basis += e.costBasisUsd;
      buckets.long_term.gain += e.gainLossUsd;
    } else {
      buckets.short_term.proceeds += e.proceedsUsd;
      buckets.short_term.basis += e.costBasisUsd;
      buckets.short_term.gain += e.gainLossUsd;
    }
  }
  const rows: CsvRow[] = Object.entries(buckets).map(([k, v]) => ({
    category: k,
    proceeds: v.proceeds.toFixed(2),
    cost_basis: v.basis.toFixed(2),
    gain_loss: v.gain.toFixed(2),
  }));
  return toCsv(rows, ["category", "proceeds", "cost_basis", "gain_loss"]);
}

export function exportTaxableEvents(
  events: TaxableEvent[],
  txs: NormalizedTransaction[]
): string {
  const txById = new Map(txs.map((t) => [t.id, t]));
  const rows: CsvRow[] = events.map((e) => {
    const tx = txById.get(e.normalizedTxId);
    return {
      date_acquired: new Date(e.dateAcquired).toISOString().slice(0, 10),
      date_sold: new Date(e.dateSold).toISOString().slice(0, 10),
      asset: e.asset,
      quantity: e.quantity,
      proceeds_usd: e.proceedsUsd.toFixed(2),
      cost_basis_usd: e.costBasisUsd.toFixed(2),
      gain_loss_usd: e.gainLossUsd.toFixed(2),
      holding_period: e.holdingPeriod,
      platform: e.platform,
      wallet: e.walletAddress ?? "",
      tx_type: tx?.txType ?? "",
      tx_hash: e.txHash ?? "",
      notes: e.notes ?? "",
    };
  });
  return toCsv(rows, [
    "date_acquired",
    "date_sold",
    "asset",
    "quantity",
    "proceeds_usd",
    "cost_basis_usd",
    "gain_loss_usd",
    "holding_period",
    "platform",
    "wallet",
    "tx_type",
    "tx_hash",
    "notes",
  ]);
}

export function exportMatchedTransfers(
  matches: TransferMatch[],
  txs: NormalizedTransaction[]
): string {
  const txById = new Map(txs.map((t) => [t.id, t]));
  const rows: CsvRow[] = matches.map((m) => {
    const out = txById.get(m.outgoingTxId);
    const inn = txById.get(m.incomingTxId);
    return {
      date: new Date(out?.timestamp ?? 0).toISOString().slice(0, 10),
      asset: m.asset,
      amount: m.amount,
      from_wallet: out?.walletAddress ?? "",
      to_wallet: inn?.walletAddress ?? "",
      matched: m.status === "confirmed" ? "yes" : "candidate",
      confidence_score: m.confidenceScore.toFixed(2),
      notes: m.notes ?? "",
    };
  });
  return toCsv(rows, [
    "date",
    "asset",
    "amount",
    "from_wallet",
    "to_wallet",
    "matched",
    "confidence_score",
    "notes",
  ]);
}

export function exportNeedsReview(items: ReviewItem[]): string {
  const rows: CsvRow[] = items.map((i) => ({
    issue_type: i.issueType,
    transaction_id: i.transactionId ?? "",
    summary: i.issueSummary,
    suggested_resolution: i.suggestedResolution,
    status: i.status,
    impact_usd: i.impactUsd.toFixed(2),
  }));
  return toCsv(rows, [
    "issue_type",
    "transaction_id",
    "summary",
    "suggested_resolution",
    "status",
    "impact_usd",
  ]);
}

export function exportNftEvents(events: TaxableEvent[]): string {
  const rows: CsvRow[] = events
    .filter((e) => e.category === "nft")
    .map((e) => ({
      date: new Date(e.dateSold).toISOString().slice(0, 10),
      action: "sell",
      collection: e.asset,
      token_id: "",
      proceeds_usd: e.proceedsUsd.toFixed(2),
      cost_basis_usd: e.costBasisUsd.toFixed(2),
      gain_loss_usd: e.gainLossUsd.toFixed(2),
      wallet: e.walletAddress ?? "",
      tx_hash: e.txHash ?? "",
    }));
  return toCsv(rows, [
    "date",
    "action",
    "collection",
    "token_id",
    "proceeds_usd",
    "cost_basis_usd",
    "gain_loss_usd",
    "wallet",
    "tx_hash",
  ]);
}

export function exportPerpPnl(events: TaxableEvent[]): string {
  const rows: CsvRow[] = events
    .filter((e) => e.category === "perp")
    .map((e) => ({
      date_closed: new Date(e.dateSold).toISOString().slice(0, 10),
      platform: e.platform,
      realized_pnl: e.gainLossUsd.toFixed(2),
      fees: "",
      net_pnl: e.gainLossUsd.toFixed(2),
    }));
  return toCsv(rows, ["date_closed", "platform", "realized_pnl", "fees", "net_pnl"]);
}

export function exportAuditLog(entries: AuditLogEntry[]): string {
  const rows: CsvRow[] = entries.map((e) => ({
    timestamp: new Date(e.createdAt).toISOString(),
    action_type: e.actionType,
    target_id: e.targetId,
    before: e.before ? JSON.stringify(e.before) : "",
    after: e.after ? JSON.stringify(e.after) : "",
    user: e.createdBy,
  }));
  return toCsv(rows, [
    "timestamp",
    "action_type",
    "target_id",
    "before",
    "after",
    "user",
  ]);
}
