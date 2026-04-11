import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useTaxableEvents } from "../hooks/useTaxableEvents";
import { useTransactions } from "../hooks/useTransactions";
import { useTransferMatches } from "../hooks/useTransferMatches";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { downloadCsv } from "../domain/exports/csv";
import {
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

  async function dl(name: string, csv: string) {
    downloadCsv(name, csv);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">Exports</h1>
        <p className="text-sm text-[color:var(--color-ink-faint)]">
          All exports are generated locally from your current data. No server round-trip.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ExportCard
          title="Summary by category"
          description="ST / LT / NFT / Perps with proceeds, basis, gain"
          file="summary_by_category.csv"
          onClick={() => dl("summary_by_category.csv", exportSummaryByCategory(events))}
        />
        <ExportCard
          title="Taxable events"
          description="Per-disposition rows for Form 8949 backup"
          file="taxable_events.csv"
          onClick={() => dl("taxable_events.csv", exportTaxableEvents(events, txs))}
        />
        <ExportCard
          title="Matched transfers"
          description="Cross-wallet transfers excluded from gain/loss"
          file="matched_transfers.csv"
          onClick={() => dl("matched_transfers.csv", exportMatchedTransfers(matches, txs))}
        />
        <ExportCard
          title="Needs review"
          description="All review items, resolved or not"
          file="needs_review.csv"
          onClick={() => dl("needs_review.csv", exportNeedsReview(items))}
        />
        <ExportCard
          title="NFT events"
          description="NFT category disposals only"
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
          description="Full history of every decision and pipeline run"
          file="audit_log.csv"
          onClick={async () => {
            const log = await listAuditLog();
            dl("audit_log.csv", exportAuditLog(log));
          }}
        />
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  file,
  onClick,
}: {
  title: string;
  description: string;
  file: string;
  onClick: () => void;
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={description} />
      <div className="flex items-center justify-between">
        <code className="text-xs text-[color:var(--color-ink-faint)]">{file}</code>
        <Button onClick={onClick}>Download</Button>
      </div>
    </Card>
  );
}
