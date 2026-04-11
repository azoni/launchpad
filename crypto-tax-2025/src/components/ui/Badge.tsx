import { classNames } from "../../lib/format";

type Tone = "neutral" | "green" | "red" | "amber" | "blue" | "violet";

const TONES: Record<Tone, string> = {
  neutral: "border-[color:var(--color-rule)] bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)]",
  green: "border-[color:var(--color-mint)] bg-[color:var(--color-mint-soft)] text-[color:var(--color-mint)]",
  red: "border-[color:var(--color-rose)] bg-[color:var(--color-rose-soft)] text-[color:var(--color-rose)]",
  amber: "border-amber-700 bg-amber-100 text-amber-900",
  blue: "border-sky-700 bg-sky-100 text-sky-900",
  violet: "border-violet-700 bg-violet-100 text-violet-900",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
