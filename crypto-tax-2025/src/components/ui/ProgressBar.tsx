export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-sm border border-[color:var(--color-rule)] bg-[color:var(--color-paper)]">
      <div
        className="h-full bg-[color:var(--color-mint)] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
