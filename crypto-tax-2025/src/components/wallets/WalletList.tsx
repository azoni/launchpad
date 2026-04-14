import { useState } from "react";
import { useWallets } from "../../hooks/useWallets";
import { useTransactions } from "../../hooks/useTransactions";
import { removeWallet } from "../../data/wallets";
import { createDataSource, updateDataSource } from "../../data/dataSources";
import { bulkInsertRaw } from "../../data/rawTransactions";
import { runPipeline } from "../../domain/pipeline";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { shortAddress, formatNumber } from "../../lib/format";
import { WalletActivityBar } from "../charts/WalletActivityBar";
import { AssetPie } from "../charts/AssetPie";
import type { Wallet, SourceType } from "../../types";

function FetchButton({ wallet }: { wallet: Wallet }) {
  const [status, setStatus] = useState<"idle" | "fetching" | "pipeline" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function fetchOnChain() {
    setStatus("fetching");
    setMsg(null);
    try {
      const endpoint = wallet.chain === "solana"
        ? "/api/fetch-solana-wallet"
        : "/api/fetch-evm-wallet";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.address, chain: wallet.chain }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { ok: boolean; totalRows: number; rows: Array<Record<string, unknown>> };

      if (!data.rows || data.rows.length === 0) {
        setMsg("No 2025 transactions found on-chain");
        setStatus("done");
        return;
      }

      // Create a data source + insert raw rows
      const sourceType: SourceType = wallet.chain === "solana" ? "solana_wallet" : "evm_wallet";
      const source = await createDataSource({
        type: sourceType,
        name: `${wallet.label} on-chain (${wallet.chain})`,
      });
      await bulkInsertRaw(source.id, data.rows);
      await updateDataSource(source.id, {
        uploadStatus: "parsed",
        rowCount: data.rows.length,
      });

      // Run pipeline
      setStatus("pipeline");
      const r = await runPipeline();
      setMsg(`${data.totalRows} on-chain txs → ${r.normalizedCount} normalized · ${r.reviewItems} to review`);
      setStatus("done");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  // Fetch works for both EVM and Solana now

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        disabled={status === "fetching" || status === "pipeline"}
        onClick={fetchOnChain}
      >
        {status === "fetching" ? "Fetching…" : status === "pipeline" ? "Running pipeline…" : "Fetch on-chain"}
      </Button>
      {status === "done" && <Badge tone="green">Done</Badge>}
      {status === "error" && <Badge tone="red">Error</Badge>}
      {msg && <span className="text-xs text-[color:var(--color-ink-faint)]">{msg}</span>}
    </div>
  );
}

export function WalletList() {
  const { wallets, loading } = useWallets();
  const { txs } = useTransactions();

  if (loading) return <div className="text-[color:var(--color-ink-faint)]">Loading wallets…</div>;
  if (wallets.length === 0) {
    return (
      <Card>
        <div className="text-sm text-[color:var(--color-ink-faint)]">
          No wallets yet. Add one above to get started.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {wallets.map((w) => {
        const walletTxs = txs.filter(
          (t) => t.walletAddress?.toLowerCase() === w.address.toLowerCase()
        );
        return (
          <Card key={w.id}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-[color:var(--color-ink)]">{w.label}</div>
                  <Badge tone={w.chain === "solana" ? "violet" : "blue"}>{w.chain}</Badge>
                  {w.isOwned && <Badge tone="green">Mine</Badge>}
                </div>
                <div className="text-xs text-[color:var(--color-ink-faint)]">{shortAddress(w.address)}</div>
                <div className="mt-1 text-xs text-[color:var(--color-ink-faint)]">
                  {formatNumber(walletTxs.length)} txs
                </div>
              </div>
              <Button variant="ghost" onClick={() => removeWallet(w.id)}>
                Remove
              </Button>
            </div>
            <div className="mb-3">
              <FetchButton wallet={w} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 text-xs font-medium text-[color:var(--color-ink-faint)]">Activity by month</div>
                <WalletActivityBar txs={txs} walletAddress={w.address} />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-[color:var(--color-ink-faint)]">Top assets</div>
                <AssetPie txs={txs} walletAddress={w.address} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
