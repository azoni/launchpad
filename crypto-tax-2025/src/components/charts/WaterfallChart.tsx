import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useMemo } from "react";
import type { TaxableEvent } from "../../types";
import { summarizeTax } from "../../domain/aggregate";

export function WaterfallChart({ events }: { events: TaxableEvent[] }) {
  const data = useMemo(() => {
    const s = summarizeTax(events);
    return [
      { name: "Short-term", value: s.shortGain },
      { name: "Long-term", value: s.longGain },
      { name: "NFT", value: s.nftNet },
      { name: "Perp", value: s.perpNet },
      { name: "Net", value: s.totalNet },
    ];
  }, [events]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.name === "Net"
                    ? d.value >= 0
                      ? "#0f172a"
                      : "#7f1d1d"
                    : d.value >= 0
                    ? "#22c55e"
                    : "#ef4444"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
