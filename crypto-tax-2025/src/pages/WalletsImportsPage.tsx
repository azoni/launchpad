import { useState } from "react";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { WalletForm } from "../components/wallets/WalletForm";
import { WalletList } from "../components/wallets/WalletList";
import { CsvUploader } from "../components/wallets/CsvUploader";
import { useDataSources } from "../hooks/useDataSources";
import { deleteDataSource } from "../data/dataSources";
import { runPipeline } from "../domain/pipeline";
import { formatDate } from "../lib/format";

export function WalletsImportsPage() {
  const { sources } = useDataSources();
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function rerun() {
    setRunning(true);
    setMsg(null);
    try {
      const r = await runPipeline();
      setMsg(
        `Pipeline complete: ${r.normalizedCount} normalized · ${r.taxableEvents} taxable events · ${r.reviewItems} review items`
      );
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">Wallets & Imports</h1>
          <p className="text-sm text-[color:var(--color-ink-faint)]">
            Add wallet addresses and upload CSV exports. Run the pipeline when you're done.
          </p>
        </div>
        <Button onClick={rerun} disabled={running}>
          {running ? "Running pipeline…" : "Re-run pipeline"}
        </Button>
      </header>

      {msg && <div className="rounded-md bg-[color:var(--color-paper-deep)] px-3 py-2 text-xs text-[color:var(--color-ink-soft)]">{msg}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <Card>
            <CardHeader title="Add wallet" subtitle="Paste an address you want to track" />
            <WalletForm />
          </Card>
          <WalletList />
        </section>

        <section className="space-y-4">
          <CsvUploader
            type="coinbase_csv"
            title="Coinbase"
            description="Export from Coinbase → Taxes → Generate report → Transaction history CSV. Includes cost basis."
          />
          <CsvUploader
            type="hyperliquid_csv"
            title="Hyperliquid"
            description="Export your fills + funding CSV from Hyperliquid"
          />
          <CsvUploader
            type="lighter_csv"
            title="Lighter"
            description="Export your trade history CSV from Lighter"
          />
          <CsvUploader
            type="generic_csv"
            title="Generic / manual CSV"
            description="Anything else: we'll do best-effort column mapping"
          />

          {sources.length > 0 && (
            <Card>
              <CardHeader title="Imports" subtitle={`${sources.length} sources uploaded`} />
              <div className="space-y-2">
                {sources.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-[color:var(--color-ink)]">{s.name}</div>
                      <div className="text-xs text-[color:var(--color-ink-faint)]">
                        {s.type} · {formatDate(s.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[color:var(--color-ink-faint)]">{s.rowCount ?? 0} rows</span>
                      <Badge
                        tone={
                          s.uploadStatus === "parsed"
                            ? "green"
                            : s.uploadStatus === "error"
                            ? "red"
                            : "amber"
                        }
                      >
                        {s.uploadStatus}
                      </Badge>
                      <Button
                        variant="ghost"
                        onClick={() => deleteDataSource(s.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
