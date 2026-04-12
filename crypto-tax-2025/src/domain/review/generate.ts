// Build the review queue from normalized transactions + FIFO warnings.
// Each ReviewItem is something the user needs to act on. Sorted by absolute
// dollar impact descending — biggest fish first.

import type {
  IssueType,
  NormalizedTransaction,
  ReviewItem,
} from "../../types";
import type { FifoResult } from "../basis/fifoEngine";
import { PROJECT_ID } from "../../lib/collections";
import { ISSUE_LABELS } from "./issueTypes";

interface GenerateInput {
  txs: NormalizedTransaction[];
  fifo: FifoResult;
}

function impactFor(t: NormalizedTransaction): number {
  return Math.abs(t.usdValue ?? 0);
}

function makeItem(args: {
  tx: NormalizedTransaction | null;
  issueType: IssueType;
  summary: string;
  suggestion: string;
  impact: number;
}): ReviewItem {
  return {
    id: crypto.randomUUID(),
    projectId: PROJECT_ID,
    transactionId: args.tx?.id ?? null,
    issueType: args.issueType,
    issueSummary: args.summary,
    suggestedResolution: args.suggestion,
    status: "open",
    impactUsd: args.impact,
    createdAt: Date.now(),
  };
}

export function generateReviewItems(input: GenerateInput): ReviewItem[] {
  const items: ReviewItem[] = [];
  const txById = new Map(input.txs.map((t) => [t.id, t]));

  // 1) FIFO warnings — most important
  for (const w of input.fifo.warnings) {
    const tx = txById.get(w.txId);
    if (!tx) continue;
    let issueType: IssueType = "unknown_type";
    if (/missing basis/i.test(w.reason)) issueType = "missing_basis";
    else if (/missing.*usdvalue|missing.*price/i.test(w.reason)) issueType = "missing_price";

    items.push(
      makeItem({
        tx,
        issueType,
        summary: `${ISSUE_LABELS[issueType]}: ${w.reason}`,
        suggestion: "Provide cost basis or USD price, then re-run pipeline.",
        impact: impactFor(tx),
      })
    );
  }

  // 2) Unknown txType rows
  for (const t of input.txs) {
    if (t.txType === "unknown" && t.reviewStatus !== "resolved") {
      items.push(
        makeItem({
          tx: t,
          issueType: "unknown_type",
          summary: `Unclassified transaction on ${t.platform}`,
          suggestion: "Mark as buy / sell / swap / transfer / spam.",
          impact: impactFor(t),
        })
      );
    }
  }

  // 3) Spam-flagged
  for (const t of input.txs) {
    if (t.txType === "spam") {
      items.push(
        makeItem({
          tx: t,
          issueType: "spam_token",
          summary: `Likely spam: ${t.assetReceived ?? "unknown asset"}`,
          suggestion: "Confirm spam (ignore) or reclassify.",
          impact: impactFor(t),
        })
      );
    }
  }

  // 4) Dust bucket — collapsed into a single representative item per asset
  const dustByAsset = new Map<string, NormalizedTransaction[]>();
  for (const t of input.txs) {
    if ((t.notes ?? "").includes("[dust]")) {
      const key = t.assetReceived ?? t.assetSent ?? "unknown";
      const arr = dustByAsset.get(key) ?? [];
      arr.push(t);
      dustByAsset.set(key, arr);
    }
  }
  for (const [asset, group] of dustByAsset.entries()) {
    const totalImpact = group.reduce((s, x) => s + impactFor(x), 0);
    items.push(
      makeItem({
        tx: group[0],
        issueType: "junk_dust",
        summary: `${group.length} dust rows for ${asset} (total ≈ $${totalImpact.toFixed(2)})`,
        suggestion: "Bulk-ignore as dust, or assign cost basis.",
        impact: totalImpact,
      })
    );
  }

  // 5) Unresolved perp rows
  for (const t of input.txs) {
    if (
      (t.txType === "perp_open" || t.txType === "perp_close") &&
      (t.usdValue === null || t.usdValue === undefined)
    ) {
      items.push(
        makeItem({
          tx: t,
          issueType: "unresolved_perp",
          summary: `Perp row missing realized PnL on ${t.platform}`,
          suggestion: "Provide realized PnL or mark as informational.",
          impact: impactFor(t),
        })
      );
    }
  }

  // 6) Wash sales detected by the FIFO engine
  for (const ev of input.fifo.taxableEvents) {
    if (ev.washSaleDisallowed > 0) {
      const tx = txById.get(ev.normalizedTxId);
      items.push(
        makeItem({
          tx: tx ?? null,
          issueType: "wash_sale",
          summary: `Wash sale: $${ev.washSaleDisallowed.toFixed(2)} loss on ${ev.asset} disallowed (repurchased within 30 days)`,
          suggestion: "Loss has been automatically disallowed and added to the replacement lot's basis. Review to confirm.",
          impact: ev.washSaleDisallowed,
        })
      );
    }
  }

  items.sort((a, b) => Math.abs(b.impactUsd) - Math.abs(a.impactUsd));
  return items;
}
