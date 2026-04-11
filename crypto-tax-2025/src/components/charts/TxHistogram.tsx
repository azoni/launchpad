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
import { txByDay } from "../../domain/aggregate";
import type { NormalizedTransaction } from "../../types";

export function TxHistogram({ txs }: { txs: NormalizedTransaction[] }) {
  const data = useMemo(() => txByDay(txs), [txs]);
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} hide />
          <YAxis stroke="#94a3b8" fontSize={10} width={32} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
          <Bar dataKey="count" fill="#0f172a" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
