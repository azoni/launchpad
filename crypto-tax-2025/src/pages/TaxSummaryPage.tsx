import { useTaxSummary } from "../hooks/useTaxSummary";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/overview/StatCard";
import { WaterfallChart } from "../components/charts/WaterfallChart";
import { TopMoversBar } from "../components/charts/TopMoversBar";
import { formatUsd } from "../lib/format";

export function TaxSummaryPage() {
  const { summary, events, loading } = useTaxSummary();

  if (loading) return <div className="text-[color:var(--color-ink-faint)]">Loading…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">Tax Summary</h1>
        <p className="text-sm text-[color:var(--color-ink-faint)]">
          Live totals from FIFO-derived taxable events. Use Exports to download for TurboTax.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Short-term" subtitle="Held ≤ 1 year" />
          <div className="space-y-1 tabular text-sm">
            <Row label="Proceeds" value={formatUsd(summary.shortProceeds)} />
            <Row label="Cost basis" value={formatUsd(summary.shortBasis)} />
            <Row label="Net" value={formatUsd(summary.shortGain, { signed: true })} bold />
          </div>
        </Card>
        <Card>
          <CardHeader title="Long-term" subtitle="Held > 1 year" />
          <div className="space-y-1 tabular text-sm">
            <Row label="Proceeds" value={formatUsd(summary.longProceeds)} />
            <Row label="Cost basis" value={formatUsd(summary.longBasis)} />
            <Row label="Net" value={formatUsd(summary.longGain, { signed: true })} bold />
          </div>
        </Card>
        <Card>
          <CardHeader title="NFT + Perp" />
          <div className="space-y-1 tabular text-sm">
            <Row label="NFT net" value={formatUsd(summary.nftNet, { signed: true })} />
            <Row label="Perp net" value={formatUsd(summary.perpNet, { signed: true })} />
            <Row
              label="Total net"
              value={formatUsd(summary.totalNet, { signed: true })}
              bold
            />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Net result (all categories)"
          value={formatUsd(summary.totalNet, { signed: true })}
          tone={summary.totalNet >= 0 ? "good" : "bad"}
        />
        <StatCard
          label="Total events"
          value={String(events.length)}
        />
        <StatCard
          label="Categories"
          value="ST · LT · NFT · Perp"
        />
      </section>

      <Card>
        <CardHeader title="Waterfall" subtitle="How each category contributes to the net" />
        <WaterfallChart events={events} />
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Top 10 gains" />
          <TopMoversBar events={events} mode="gains" />
        </Card>
        <Card>
          <CardHeader title="Top 10 losses" />
          <TopMoversBar events={events} mode="losses" />
        </Card>
      </section>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[color:var(--color-ink-faint)]">{label}</div>
      <div className={bold ? "font-semibold text-[color:var(--color-ink)]" : "text-[color:var(--color-ink-soft)]"}>{value}</div>
    </div>
  );
}
