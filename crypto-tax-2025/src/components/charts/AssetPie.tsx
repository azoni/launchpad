import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { useMemo } from "react";
import { activityByAsset } from "../../domain/aggregate";
import type { NormalizedTransaction } from "../../types";

const COLORS = ["#0ea5e9", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8"];

export function AssetPie({
  txs,
  walletAddress,
}: {
  txs: NormalizedTransaction[];
  walletAddress?: string;
}) {
  const data = useMemo(() => {
    const filtered = walletAddress
      ? txs.filter((t) => t.walletAddress?.toLowerCase() === walletAddress.toLowerCase())
      : txs;
    const buckets = activityByAsset(filtered).slice(0, 5);
    const top = buckets.map((b) => ({ name: b.asset, value: b.totalUsd }));
    const otherUsd = activityByAsset(filtered)
      .slice(5)
      .reduce((s, b) => s + b.totalUsd, 0);
    if (otherUsd > 0) top.push({ name: "Other", value: otherUsd });
    return top;
  }, [txs, walletAddress]);

  if (data.length === 0) {
    return <div className="flex h-32 items-center justify-center text-xs text-[color:var(--color-ink-faint)]">No activity</div>;
  }

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={28} outerRadius={50}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
