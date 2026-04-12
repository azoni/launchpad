import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useTaxableEvents } from "../hooks/useTaxableEvents";
import { useTransactions } from "../hooks/useTransactions";
import { useTransferMatches } from "../hooks/useTransferMatches";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { downloadCsv } from "../domain/exports/csv";
import {
  exportForm8949,
  exportScheduleD,
  exportIncomeSchedule1,
  exportTurboTaxChecklist,
  exportSummaryByCategory,
  exportTaxableEvents,
  exportMatchedTransfers,
  exportNeedsReview,
  exportNftEvents,
  exportPerpPnl,
  exportAuditLog,
} from "../domain/exports";
import { listAuditLog } from "../data/auditLog";

export function ExportsPage() {
  const { events } = useTaxableEvents();
  const { txs } = useTransactions();
  const { matches } = useTransferMatches();
  const { items } = useReviewQueue();

  function dl(name: string, csv: string) {
    downloadCsv(name, csv);
  }

  function dlText(name: string, text: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasIncome = txs.some((t) => t.txType === "income");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">Exports</h1>
        <p className="text-sm text-[color:var(--color-ink-faint)]">
          All exports are generated locally. Start with the TurboTax section — those are the files you need for filing.
        </p>
      </header>

      {/* TurboTax filing section */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-xl font-bold text-[color:var(--color-ink)]">TurboTax Filing</h2>
          <Badge tone="green">Start here</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ExportCard
            title="Form 8949 — TurboTax Import"
            description="Upload this CSV directly into TurboTax under Investments → Cryptocurrency. Contains all disposal rows with MM/DD/YYYY dates, Box codes, and wash sale adjustments."
            file="form_8949_turbotax.csv"
            onClick={() => dl("form_8949_turbotax.csv", exportForm8949(events))}
            primary
          />
          <ExportCard
            title="Schedule D Summary"
            description="Short-term + long-term totals with wash sale adjustments. Use to verify TurboTax imported correctly."
            file="schedule_d_summary.csv"
            onClick={() => dl("schedule_d_summary.csv", exportScheduleD(events))}
            primary
          />
          {hasIncome && (
            <ExportCard
              title="Schedule 1 — Crypto Income"
              description="Staking rewards, airdrops, etc. Enter the total on Schedule 1, Line 8z as 'Other income'. Includes per-row backup."
              file="income_schedule_1.csv"
              onClick={() => dl("income_schedule_1.csv", exportIncomeSchedule1(txs))}
              primary
            />
          )}
          <ExportCard
            title="TurboTax Checklist"
            description="Step-by-step text file telling you exactly what to enter where in TurboTax, with all the numbers pre-filled."
            file="turbotax_checklist.txt"
            onClick={() => dlText("turbotax_checklist.txt", exportTurboTaxChecklist(events, txs))}
            primary
          />
        </div>
      </section>

      {/* Audit backup section */}
      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-[color:var(--color-ink)]">Audit Backup</h2>
        <p className="mb-3 text-xs text-[color:var(--color-ink-faint)]">
          Keep these files in case the IRS asks for documentation. They trace every number back to raw transactions.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ExportCard
            title="Summary by category"
            description="ST / LT / NFT / Perps with proceeds, basis, gain"
            file="summary_by_category.csv"
            onClick={() => dl("summary_by_category.csv", exportSummaryByCategory(events))}
          />
          <ExportCard
            title="All taxable events (detailed)"
            description="Every disposal row with full metadata — the raw Form 8949 backup"
            file="taxable_events.csv"
            onClick={() => dl("taxable_events.csv", exportTaxableEvents(events, txs))}
          />
          <ExportCard
            title="Matched transfers"
            description="Cross-wallet transfers excluded from gain/loss — proves they aren't sales"
            file="matched_transfers.csv"
            onClick={() => dl("matched_transfers.csv", exportMatchedTransfers(matches, txs))}
          />
          <ExportCard
            title="Needs review"
            description="All review items, resolved or not — shows what was flagged and how it was resolved"
            file="needs_review.csv"
            onClick={() => dl("needs_review.csv", exportNeedsReview(items))}
          />
          <ExportCard
            title="NFT events"
            description="NFT category disposals"
            file="nft_events.csv"
            onClick={() => dl("nft_events.csv", exportNftEvents(events))}
          />
          <ExportCard
            title="Perp PnL"
            description="Hyperliquid + Lighter realized PnL"
            file="perp_pnl.csv"
            onClick={() => dl("perp_pnl.csv", exportPerpPnl(events))}
          />
          <ExportCard
            title="Audit log"
            description="Full history of every decision, resolution, and pipeline run"
            file="audit_log.csv"
            onClick={async () => {
              const log = await listAuditLog();
              dl("audit_log.csv", exportAuditLog(log));
            }}
          />
        </div>
      </section>
    </div>
  );
}

function ExportCard({
  title,
  description,
  file,
  onClick,
  primary,
}: {
  title: string;
  description: string;
  file: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <Card className={primary ? "border-2 border-[color:var(--color-ink)]" : undefined}>
      <CardHeader title={title} subtitle={description} />
      <div className="flex items-center justify-between">
        <code className="text-[11px] text-[color:var(--color-ink-faint)]">{file}</code>
        <Button onClick={onClick} variant={primary ? "primary" : "secondary"}>
          Download
        </Button>
      </div>
    </Card>
  );
}
