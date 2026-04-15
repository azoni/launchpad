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
import { PipelineProgress, type PipelineStage } from "./PipelineProgress";
import { shortAddress, formatNumber } from "../../lib/format";
import { WalletActivityBar } from "../charts/WalletActivityBar";
import { AssetPie } from "../charts/AssetPie";
import type { Wallet, SourceType } from "../../types";

function FetchButton({ wallet }: { wallet: Wallet }) {
  const [status, setStatus] = useState<PipelineStage>("idle");
  const [detail, setDetail] = useState<string | null>(null);

  async function fetchOnChain() {
    setDetail(null);
    setStatus("fetching");

    try {
      let rows: Array<Record<string, unknown>>;

      if (wallet.chain === "solana") {
        // Solana: fetch client-side (browser's IP isn't rate-limited,
        // and no 10-second Netlify function timeout)
        const { fetchSolanaWallet } = await import("../../domain/fetchSolana");
        rows = await fetchSolanaWallet(wallet.address, (p) => {
          setDetail(p.detail);
          if (p.totalSigs > 0) {
            setDetail(`${p.detail} (${p.txsProcessed}/${p.totalSigs})`);
          }
        });
      } else {
        // EVM: use Netlify function (has Etherscan API key server-side)
        setDetail(`Fetching ${wallet.chain} transactions via Etherscan…`);
        const res = await fetch("/api/fetch-evm-wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: wallet.address, chain: wallet.chain }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          ok: boolean;
          totalRows: number;
          rows: Array<Record<string, unknown>>;
        };
        rows = data.rows ?? [];
      }

      if (rows.length === 0) {
        setDetail("No 2025 transactions found on-chain");
        setStatus("done");
        return;
      }

      setStatus("importing");
      setDetail(`Found ${rows.length} transactions. Saving…`);

      const sourceType: SourceType = wallet.chain === "solana" ? "solana_wallet" : "evm_wallet";
      const source = await createDataSource({
        type: sourceType,
        name: `${wallet.label} on-chain (${wallet.chain})`,
      });
      await bulkInsertRaw(source.id, rows);
      await updateDataSource(source.id, {
        uploadStatus: "parsed",
        rowCount: rows.length,
      });

      setStatus("running_pipeline");
      setDetail("Normalizing → pricing → classifying → FIFO → review…");
      const r = await runPipeline();
      setDetail(
        `${rows.length} on-chain txs → ${r.normalizedCount} normalized · ${r.pricesFilled} prices filled · ${r.taxableEvents} taxable · ${r.reviewItems} to review`
      );
      setStatus("done");
    } catch (e) {
      setDetail(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        disabled={status === "fetching" || status === "importing" || status === "running_pipeline"}
        onClick={fetchOnChain}
      >
        {status === "idle" || status === "done" || status === "error"
          ? "Fetch on-chain"
          : "Fetching…"}
      </Button>
      <PipelineProgress status={status} mode="fetch" detail={detail} />
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
