import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { TaxableEvent } from "../../types";
import { pnlByMonth } from "../../domain/aggregate";
import { useMemo } from "react";

export function MonthlyPnlChart({ events }: { events: TaxableEvent[] }) {
  const data = useMemo(() => pnlByMonth(events), [events]);
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(v: number) => `$${v.toFixed(2)}`}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="short" name="Short-term" stackId="1" fill="#fde68a" stroke="#f59e0b" />
          <Area type="monotone" dataKey="long" name="Long-term" stackId="1" fill="#bbf7d0" stroke="#22c55e" />
          <Area type="monotone" dataKey="nft" name="NFT" stackId="1" fill="#ddd6fe" stroke="#8b5cf6" />
          <Area type="monotone" dataKey="perp" name="Perp" stackId="1" fill="#bae6fd" stroke="#0ea5e9" />
          <Line type="monotone" dataKey="net" name="Net" stroke="#0f172a" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
