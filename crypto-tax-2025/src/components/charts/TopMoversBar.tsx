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

export function TopMoversBar({
  events,
  mode,
}: {
  events: TaxableEvent[];
  mode: "gains" | "losses";
}) {
  const data = useMemo(() => {
    const sorted = events
      .slice()
      .sort((a, b) =>
        mode === "gains" ? b.gainLossUsd - a.gainLossUsd : a.gainLossUsd - b.gainLossUsd
      );
    return sorted
      .filter((e) => (mode === "gains" ? e.gainLossUsd > 0 : e.gainLossUsd < 0))
      .slice(0, 10)
      .map((e) => ({ name: `${e.asset}`, value: Math.abs(e.gainLossUsd) }));
  }, [events, mode]);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-[color:var(--color-ink-faint)]">
        No {mode}
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `$${v}`} />
          <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={64} />
          <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={mode === "gains" ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
