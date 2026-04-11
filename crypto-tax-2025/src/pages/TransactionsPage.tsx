import { useMemo, useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { Card, CardHeader } from "../components/ui/Card";
import { Input, Label, Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { TxHistogram } from "../components/charts/TxHistogram";
import { formatDate, formatUsd, shortAddress } from "../lib/format";
import type { TxType, Platform, ReviewStatus } from "../types";

export function TransactionsPage() {
  const { txs, loading } = useTransactions();
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [txType, setTxType] = useState<TxType | "all">("all");
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return txs.filter((t) => {
      if (platform !== "all" && t.platform !== platform) return false;
      if (txType !== "all" && t.txType !== txType) return false;
      if (status !== "all" && t.reviewStatus !== status) return false;
      if (search) {
        const s = search.toLowerCase();
        if (
          !(t.assetReceived ?? "").toLowerCase().includes(s) &&
          !(t.assetSent ?? "").toLowerCase().includes(s) &&
          !(t.txHash ?? "").toLowerCase().includes(s) &&
          !(t.walletAddress ?? "").toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [txs, platform, txType, status, search]);

  if (loading) return <div className="text-[color:var(--color-ink-faint)]">Loading transactions…</div>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">Transactions</h1>
        <p className="text-sm text-[color:var(--color-ink-faint)]">{filtered.length} of {txs.length} rows shown</p>
      </header>

      <Card>
        <CardHeader title="Activity" subtitle="Daily tx count, respects filters" />
        <TxHistogram txs={filtered} />
      </Card>

      <Card>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label htmlFor="platform">Platform</Label>
            <Select id="platform" value={platform} onChange={(e) => setPlatform(e.target.value as Platform | "all")}>
              <option value="all">All</option>
              <option value="metamask">MetaMask</option>
              <option value="phantom">Phantom</option>
              <option value="abstract">Abstract</option>
              <option value="hyperliquid">Hyperliquid</option>
              <option value="lighter">Lighter</option>
              <option value="manual">Manual</option>
              <option value="unknown">Unknown</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select id="type" value={txType} onChange={(e) => setTxType(e.target.value as TxType | "all")}>
              <option value="all">All</option>
              {(["buy","sell","swap","transfer_in","transfer_out","bridge","fee","nft_buy","nft_sell","nft_transfer","nft_mint","perp_open","perp_close","realized_pnl","spam","unknown"] as TxType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Review status</Label>
            <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus | "all")}>
              <option value="all">All</option>
              <option value="ok">OK</option>
              <option value="needs_review">Needs review</option>
              <option value="resolved">Resolved</option>
              <option value="ignored">Ignored</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="search">Search</Label>
            <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="asset, hash, address…" />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-rule)] text-left text-xs uppercase tracking-wide text-[color:var(--color-ink-faint)]">
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Platform</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Asset</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-2 py-2 text-right">USD</th>
                <th className="px-2 py-2">Wallet</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {filtered.slice(0, 500).map((t) => (
                <tr key={t.id} className="border-b border-[color:var(--color-rule)] hover:bg-[color:var(--color-paper)]">
                  <td className="px-2 py-1.5">{formatDate(t.timestamp)}</td>
                  <td className="px-2 py-1.5">{t.platform}</td>
                  <td className="px-2 py-1.5">{t.txType}</td>
                  <td className="px-2 py-1.5">{t.assetReceived ?? t.assetSent ?? "—"}</td>
                  <td className="px-2 py-1.5 text-right">
                    {t.amountReceived ?? t.amountSent ?? "—"}
                  </td>
                  <td className="px-2 py-1.5 text-right">{formatUsd(t.usdValue)}</td>
                  <td className="px-2 py-1.5">{t.walletAddress ? shortAddress(t.walletAddress) : "—"}</td>
                  <td className="px-2 py-1.5">
                    <Badge
                      tone={
                        t.reviewStatus === "needs_review"
                          ? "amber"
                          : t.reviewStatus === "resolved"
                          ? "green"
                          : "neutral"
                      }
                    >
                      {t.reviewStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <div className="px-2 py-2 text-xs text-[color:var(--color-ink-faint)]">
              Showing first 500 of {filtered.length}. Refine filters to see more.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
