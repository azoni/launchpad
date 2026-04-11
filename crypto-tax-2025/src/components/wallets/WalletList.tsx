import { useWallets } from "../../hooks/useWallets";
import { useTransactions } from "../../hooks/useTransactions";
import { removeWallet } from "../../data/wallets";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { shortAddress, formatNumber } from "../../lib/format";
import { WalletActivityBar } from "../charts/WalletActivityBar";
import { AssetPie } from "../charts/AssetPie";

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
