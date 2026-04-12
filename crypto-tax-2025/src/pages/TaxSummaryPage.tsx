import { useMemo } from "react";
import { useTaxSummary } from "../hooks/useTaxSummary";
import { useTransactions } from "../hooks/useTransactions";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/overview/StatCard";
import { Badge } from "../components/ui/Badge";
import { WaterfallChart } from "../components/charts/WaterfallChart";
import { TopMoversBar } from "../components/charts/TopMoversBar";
import { formatUsd } from "../lib/format";

export function TaxSummaryPage() {
  const { summary, events, loading } = useTaxSummary();
  const { txs } = useTransactions();

  const incomeTotal = useMemo(
    () => txs.filter((t) => t.txType === "income").reduce((s, t) => s + (t.usdValue ?? 0), 0),
    [txs]
  );

  if (loading) return <div className="text-[color:var(--color-ink-faint)]">Loading…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">Tax Summary</h1>
        <p className="text-sm text-[color:var(--color-ink-faint)]">
          Live totals from FIFO-derived taxable events. Numbers below map directly to your TurboTax entries.
        </p>
      </header>

      {/* TurboTax entry guide */}
      <Card>
        <CardHeader title="TurboTax entry guide" subtitle="Where each number goes in TurboTax" />
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Badge tone="blue">Step 1</Badge>
            <div>
              <div className="font-semibold text-[color:var(--color-ink)]">Form 8949 / Schedule D — Capital Gains</div>
              <div className="text-[color:var(--color-ink-faint)]">
                TurboTax → Wages & Income → Investments → Cryptocurrency → Upload CSV
              </div>
              <div className="mt-1 text-[color:var(--color-ink-soft)]">
                Upload <code className="rounded bg-[color:var(--color-paper-deep)] px-1 text-[11px]">form_8949_turbotax.csv</code> from the Exports page. TurboTax will parse all {events.length} rows.
              </div>
            </div>
          </div>
          {incomeTotal > 0 && (
            <div className="flex items-start gap-3">
              <Badge tone="blue">Step 2</Badge>
              <div>
                <div className="font-semibold text-[color:var(--color-ink)]">Schedule 1, Line 8z — Other Income</div>
                <div className="text-[color:var(--color-ink-faint)]">
                  TurboTax → Wages & Income → Other Income → Other Reportable Income
                </div>
                <div className="mt-1 text-[color:var(--color-ink-soft)]">
                  Enter <span className="tabular font-semibold">{formatUsd(incomeTotal)}</span> as "Cryptocurrency staking/airdrop income"
                </div>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Badge tone="blue">Step {incomeTotal > 0 ? 3 : 2}</Badge>
            <div>
              <div className="font-semibold text-[color:var(--color-ink)]">Verify totals match</div>
              <div className="text-[color:var(--color-ink-faint)]">
                After import, TurboTax should show the same short-term and long-term totals as below.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Copy-ready numbers */}
      <Card>
        <CardHeader title="Numbers for TurboTax" subtitle="Copy these into TurboTax if entering manually" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-rule)] text-left text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-ink-faint)]">
                <th className="py-2">Line</th>
                <th className="py-2 text-right">Proceeds (d)</th>
                <th className="py-2 text-right">Cost Basis (e)</th>
                {summary.totalWashSale > 0 && <th className="py-2 text-right">Wash Sale (g)</th>}
                <th className="py-2 text-right">Gain/Loss (h)</th>
              </tr>
            </thead>
            <tbody className="tabular">
              <tr className="border-b border-[color:var(--color-rule)]">
                <td className="py-2 text-[color:var(--color-ink-soft)]">Part I — Short-Term (Box C)</td>
                <td className="py-2 text-right">{formatUsd(summary.shortProceeds)}</td>
                <td className="py-2 text-right">{formatUsd(summary.shortBasis)}</td>
                {summary.totalWashSale > 0 && <td className="py-2 text-right">{formatUsd(summary.shortWashSale)}</td>}
                <td className="py-2 text-right font-semibold">{formatUsd(summary.shortGain + summary.shortWashSale, { signed: true })}</td>
              </tr>
              <tr className="border-b border-[color:var(--color-rule)]">
                <td className="py-2 text-[color:var(--color-ink-soft)]">Part II — Long-Term (Box F)</td>
                <td className="py-2 text-right">{formatUsd(summary.longProceeds)}</td>
                <td className="py-2 text-right">{formatUsd(summary.longBasis)}</td>
                {summary.totalWashSale > 0 && <td className="py-2 text-right">{formatUsd(summary.longWashSale)}</td>}
                <td className="py-2 text-right font-semibold">{formatUsd(summary.longGain + summary.longWashSale, { signed: true })}</td>
              </tr>
              <tr className="font-semibold">
                <td className="py-2">Total</td>
                <td className="py-2 text-right">{formatUsd(summary.shortProceeds + summary.longProceeds)}</td>
                <td className="py-2 text-right">{formatUsd(summary.shortBasis + summary.longBasis)}</td>
                {summary.totalWashSale > 0 && <td className="py-2 text-right">{formatUsd(summary.totalWashSale)}</td>}
                <td className="py-2 text-right">{formatUsd(summary.totalNetAfterWash, { signed: true })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader title="Short-term" subtitle="Held ≤ 1 year · Form 8949 Part I" />
          <div className="space-y-1 tabular text-sm">
            <Row label="Proceeds" value={formatUsd(summary.shortProceeds)} />
            <Row label="Cost basis" value={formatUsd(summary.shortBasis)} />
            {summary.shortWashSale > 0 && <Row label="Wash sale adj." value={formatUsd(summary.shortWashSale)} />}
            <Row label="Net" value={formatUsd(summary.shortGain + summary.shortWashSale, { signed: true })} bold />
          </div>
        </Card>
        <Card>
          <CardHeader title="Long-term" subtitle="Held > 1 year · Form 8949 Part II" />
          <div className="space-y-1 tabular text-sm">
            <Row label="Proceeds" value={formatUsd(summary.longProceeds)} />
            <Row label="Cost basis" value={formatUsd(summary.longBasis)} />
            {summary.longWashSale > 0 && <Row label="Wash sale adj." value={formatUsd(summary.longWashSale)} />}
            <Row label="Net" value={formatUsd(summary.longGain + summary.longWashSale, { signed: true })} bold />
          </div>
        </Card>
        <Card>
          <CardHeader title="Other" subtitle="NFT + Perp + Income" />
          <div className="space-y-1 tabular text-sm">
            <Row label="NFT net" value={formatUsd(summary.nftNet, { signed: true })} />
            <Row label="Perp net" value={formatUsd(summary.perpNet, { signed: true })} />
            {incomeTotal > 0 && <Row label="Income (Sch 1)" value={formatUsd(incomeTotal)} />}
            <Row label="Capital net" value={formatUsd(summary.totalNetAfterWash, { signed: true })} bold />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Net capital result"
          value={formatUsd(summary.totalNetAfterWash, { signed: true })}
          tone={summary.totalNetAfterWash >= 0 ? "good" : "bad"}
        />
        <StatCard label="Total disposals" value={String(events.length)} />
        {summary.totalWashSale > 0 && (
          <StatCard
            label="Wash sale disallowed"
            value={formatUsd(summary.totalWashSale)}
            tone="bad"
            hint="Added to replacement lot basis"
          />
        )}
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
