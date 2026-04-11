import { Card } from "../ui/Card";
import { classNames } from "../../lib/format";

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "good" | "bad";
}) {
  const valueColor =
    tone === "good"
      ? "text-[color:var(--color-mint)]"
      : tone === "bad"
      ? "text-[color:var(--color-rose)]"
      : "text-[color:var(--color-ink)]";
  return (
    <Card className="flex flex-col gap-1">
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
        {label}
      </div>
      <div className={classNames("tabular text-2xl font-semibold", valueColor)}>{value}</div>
      {hint && (
        <div className="text-[11px] text-[color:var(--color-ink-faint)]">{hint}</div>
      )}
    </Card>
  );
}
