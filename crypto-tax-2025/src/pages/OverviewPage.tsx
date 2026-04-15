import { useState } from "react";
import { useProject } from "../hooks/useProject";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { useTaxSummary } from "../hooks/useTaxSummary";
import { useTransactions } from "../hooks/useTransactions";
import { useTransferMatches } from "../hooks/useTransferMatches";
import { runPipeline } from "../domain/pipeline";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ProgressBar } from "../components/ui/ProgressBar";
import { StatCard } from "../components/overview/StatCard";
import { MonthlyPnlChart } from "../components/charts/MonthlyPnlChart";
import { PlatformDonut } from "../components/charts/PlatformDonut";
import { formatNumber, formatUsd } from "../lib/format";
import { Link } from "react-router-dom";

export function OverviewPage() {
  const { project, loading: projectLoading } = useProject();
  const { txs } = useTransactions();
  const { matches } = useTransferMatches();
  const { open, total, progress } = useReviewQueue();
  const { summary, events } = useTaxSummary();
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  if (projectLoading || !project) {
    return <div className="text-[color:var(--color-ink-faint)]">Loading project…</div>;
  }

  async function handleRun(fillPrices = false) {
    setRunning(true);
    try {
      const r = await runPipeline({ fillPrices });
      setLastRun(
        `Processed ${r.rawCount} raw → ${r.normalizedCount} normalized · ${r.pricesFilled} prices filled · ${r.taxableEvents} taxable events · ${r.reviewItems} review items`
      );
    } catch (e) {
      setLastRun(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">{project.name}</h1>
          <p className="text-sm text-[color:var(--color-ink-faint)]">
            Tax year {project.taxYear} · {project.basisMethod.toUpperCase()} cost basis
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/review">
            <Button variant="secondary">Review queue</Button>
          </Link>
          <Button variant="secondary" onClick={() => handleRun(false)} disabled={running}>
            {running ? "Running…" : "Re-run pipeline"}
          </Button>
          <Button onClick={() => handleRun(true)} disabled={running}>
            {running ? "Running…" : "Fill prices & re-run"}
          </Button>
        </div>
      </header>

      {lastRun && (
        <div className="rounded-md bg-[color:var(--color-paper-deep)] px-3 py-2 text-xs text-[color:var(--color-ink-soft)]">{lastRun}</div>
      )}

      <section>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[color:var(--color-ink-faint)]">Resolution progress</div>
              <div className="text-xs text-[color:var(--color-ink-faint)]">
                {total - open.length} of {total} review items resolved
              </div>
            </div>
            <div className="tabular font-display text-3xl font-bold text-[color:var(--color-ink)]">
              {progress.toFixed(0)}%
            </div>
          </div>
          <ProgressBar value={progress} />
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Raw rows" value={formatNumber(txs.length)} />
        <StatCard label="Normalized txs" value={formatNumber(txs.length)} />
        <StatCard label="Matched transfers" value={formatNumber(matches.length)} />
        <StatCard label="Taxable events" value={formatNumber(events.length)} />
        <StatCard
          label="Unresolved issues"
          value={formatNumber(open.length)}
          tone={open.length === 0 ? "good" : "bad"}
        />
        <StatCard
          label="Short-term gain/loss"
          value={formatUsd(summary.shortGain, { signed: true })}
          tone={summary.shortGain >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Long-term gain/loss"
          value={formatUsd(summary.longGain, { signed: true })}
          tone={summary.longGain >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="NFT gain/loss"
          value={formatUsd(summary.nftNet, { signed: true })}
          tone={summary.nftNet >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Perp realized"
          value={formatUsd(summary.perpNet, { signed: true })}
          tone={summary.perpNet >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Net result"
          value={formatUsd(summary.totalNet, { signed: true })}
          tone={summary.totalNet >= 0 ? "good" : "bad"}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly P&L" subtitle="Stacked by category, with net line" />
          <MonthlyPnlChart events={events} />
        </Card>
        <Card>
          <CardHeader title="Platform mix" subtitle="By taxable proceeds" />
          <PlatformDonut events={events} />
        </Card>
      </section>
    </div>
  );
}
