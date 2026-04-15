// CSV exports for TurboTax filing + audit backup.

import type {
  AuditLogEntry,
  NormalizedTransaction,
  ReviewItem,
  TaxableEvent,
  TransferMatch,
} from "../../types";
import type { IncomeEvent } from "../basis/fifoEngine";
import { toCsv, type CsvRow } from "./csv";

function mmddyyyy(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

// ─── TurboTax-ready exports ──────────────────────────────────────────

/** Form 8949 CSV — the one you upload directly into TurboTax.
 *  One row per disposal. Columns match TurboTax's "Other CSV" import format.
 *  Produces separate sections for Box C (short-term) and Box F (long-term). */
export function exportForm8949(events: TaxableEvent[]): string {
  const rows: CsvRow[] = events
    .filter((e) => e.category !== "income" && e.quantity > 0)
    .map((e) => ({
      "Description": `${e.quantity} ${e.asset}`,
      "Date Acquired": mmddyyyy(e.dateAcquired),
      "Date Sold": mmddyyyy(e.dateSold),
      "Proceeds": e.proceedsUsd.toFixed(2),
      "Cost Basis": e.costBasisUsd.toFixed(2),
      "Adjustment Code": e.washSaleDisallowed > 0 ? "W" : "",
      "Adjustment Amount": e.washSaleDisallowed > 0 ? e.washSaleDisallowed.toFixed(2) : "",
      "Gain or Loss": (e.gainLossUsd + e.washSaleDisallowed).toFixed(2),
      "Box": e.form8949Box,
      "Holding Period": e.holdingPeriod === "short" ? "Short-term" : "Long-term",
    }));
  return toCsv(rows, [
    "Description",
    "Date Acquired",
    "Date Sold",
    "Proceeds",
    "Cost Basis",
    "Adjustment Code",
    "Adjustment Amount",
    "Gain or Loss",
    "Box",
    "Holding Period",
  ]);
}

/** Schedule D summary — the totals TurboTax asks for on lines 1a-7 and 8a-15. */
export function exportScheduleD(events: TaxableEvent[]): string {
  const st = events.filter((e) => e.holdingPeriod === "short" && e.category !== "income");
  const lt = events.filter((e) => e.holdingPeriod === "long" && e.category !== "income");
  const stProceeds = st.reduce((s, e) => s + e.proceedsUsd, 0);
  const stBasis = st.reduce((s, e) => s + e.costBasisUsd, 0);
  const stWash = st.reduce((s, e) => s + e.washSaleDisallowed, 0);
  const stGain = st.reduce((s, e) => s + e.gainLossUsd, 0) + stWash;
  const ltProceeds = lt.reduce((s, e) => s + e.proceedsUsd, 0);
  const ltBasis = lt.reduce((s, e) => s + e.costBasisUsd, 0);
  const ltWash = lt.reduce((s, e) => s + e.washSaleDisallowed, 0);
  const ltGain = lt.reduce((s, e) => s + e.gainLossUsd, 0) + ltWash;

  const rows: CsvRow[] = [
    { line: "Part I — Short-Term", proceeds: stProceeds.toFixed(2), cost_basis: stBasis.toFixed(2), wash_sale_adjustment: stWash.toFixed(2), gain_or_loss: stGain.toFixed(2) },
    { line: "Part II — Long-Term", proceeds: ltProceeds.toFixed(2), cost_basis: ltBasis.toFixed(2), wash_sale_adjustment: ltWash.toFixed(2), gain_or_loss: ltGain.toFixed(2) },
    { line: "Total", proceeds: (stProceeds + ltProceeds).toFixed(2), cost_basis: (stBasis + ltBasis).toFixed(2), wash_sale_adjustment: (stWash + ltWash).toFixed(2), gain_or_loss: (stGain + ltGain).toFixed(2) },
  ];
  return toCsv(rows, ["line", "proceeds", "cost_basis", "wash_sale_adjustment", "gain_or_loss"]);
}

/** Schedule 1 / misc income — staking rewards, airdrops, etc.
 *  Derived from normalized transactions with txType === "income".
 *  TurboTax asks for total "other income" on Schedule 1, Line 8z. */
export function exportIncomeSchedule1(txs: NormalizedTransaction[]): string {
  const incomeTxs = txs.filter((t) => t.txType === "income");
  const rows: CsvRow[] = incomeTxs.map((t) => ({
    "Date Received": mmddyyyy(t.timestamp),
    "Asset": t.assetReceived ?? "",
    "Quantity": t.amountReceived ?? "",
    "Fair Market Value (USD)": (t.usdValue ?? 0).toFixed(2),
    "Source": (t.notes ?? "").includes("airdrop") ? "Airdrop" : "Staking Reward",
    "Platform": t.platform,
    "Tx Hash": t.txHash ?? "",
  }));
  const total = incomeTxs.reduce((s, t) => s + (t.usdValue ?? 0), 0);
  rows.push({
    "Date Received": "",
    "Asset": "TOTAL",
    "Quantity": "",
    "Fair Market Value (USD)": total.toFixed(2),
    "Source": "Schedule 1, Line 8z",
    "Platform": "",
    "Tx Hash": "",
  });
  return toCsv(rows, [
    "Date Received",
    "Asset",
    "Quantity",
    "Fair Market Value (USD)",
    "Source",
    "Platform",
    "Tx Hash",
  ]);
}

/** TurboTax checklist — what to enter where. Plain text, not CSV. */
export function exportTurboTaxChecklist(events: TaxableEvent[], txs: NormalizedTransaction[]): string {
  const st = events.filter((e) => e.holdingPeriod === "short" && e.category !== "income");
  const lt = events.filter((e) => e.holdingPeriod === "long" && e.category !== "income");
  const stTotal = st.reduce((s, e) => s + e.gainLossUsd + e.washSaleDisallowed, 0);
  const ltTotal = lt.reduce((s, e) => s + e.gainLossUsd + e.washSaleDisallowed, 0);
  const washTotal = events.reduce((s, e) => s + e.washSaleDisallowed, 0);
  const incomeTxs = txs.filter((t) => t.txType === "income");
  const incomeTotal = incomeTxs.reduce((s, t) => s + (t.usdValue ?? 0), 0);

  return `TURBOTAX CRYPTO TAX CHECKLIST — 2025
=====================================

STEP 1: Capital Gains (Form 8949 / Schedule D)
-----------------------------------------------
In TurboTax: Wages & Income → Investments → Cryptocurrency

Upload: form_8949_turbotax.csv
  - Contains ${events.length} disposal rows
  - Short-term (Box C): ${st.length} rows → Net: $${stTotal.toFixed(2)}
  - Long-term (Box F): ${lt.length} rows → Net: $${ltTotal.toFixed(2)}
${washTotal > 0 ? `  - Wash sale adjustments: $${washTotal.toFixed(2)} (Column g, Code W)\n` : ""}
When TurboTax asks "Did you receive a 1099-B?": No
When TurboTax asks which box: Check Box C (short-term) or Box F (long-term)

STEP 2: Crypto Income (Schedule 1, Line 8z)
--------------------------------------------
${incomeTotal > 0 ? `In TurboTax: Wages & Income → Other Income → Other Reportable Income
Enter: $${incomeTotal.toFixed(2)} as "Cryptocurrency staking/airdrop income"
Backup: income_schedule_1.csv (${incomeTxs.length} rows)` : "No staking/airdrop income detected."}

STEP 3: Review
--------------
- Download: schedule_d_summary.csv for the numbers to verify
- Download: audit_log.csv if the IRS asks for documentation
- Download: needs_review.csv to confirm no unresolved items remain

NUMBERS TO ENTER
================
Short-term net gain/loss:  $${stTotal.toFixed(2)}
Long-term net gain/loss:   $${ltTotal.toFixed(2)}
${washTotal > 0 ? `Wash sale disallowed:      $${washTotal.toFixed(2)}\n` : ""}${incomeTotal > 0 ? `Other income (staking):    $${incomeTotal.toFixed(2)}\n` : ""}
Generated ${new Date().toISOString().slice(0, 10)} by Crypto Tax 2025
`;
}

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
