import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useMemo } from "react";
import type { NormalizedTransaction } from "../../types";

export function WalletActivityBar({
  txs,
  walletAddress,
}: {
  txs: NormalizedTransaction[];
  walletAddress: string;
}) {
  const data = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const t of txs) {
      if (t.walletAddress?.toLowerCase() !== walletAddress.toLowerCase()) continue;
      const d = new Date(t.timestamp);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const out: Array<{ month: string; count: number }> = [];
    for (let m = 1; m <= 12; m++) {
      const key = `2025-${String(m).padStart(2, "0")}`;
      out.push({ month: key.slice(5), count: buckets.get(key) ?? 0 });
    }
    return out;
  }, [txs, walletAddress]);

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} />
          <YAxis stroke="#94a3b8" fontSize={10} width={24} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
          <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
