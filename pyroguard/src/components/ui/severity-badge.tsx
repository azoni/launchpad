import { cn } from "@/lib/utils";

/**
 * One shared visual language for "how urgent/dangerous is this?" — used by both
 * deficiency severity (critical/major/minor) and job priority (Critical/High/Medium/Low),
 * so "Critical" looks identical everywhere instead of a tiny dot on one screen and
 * gray text on another. Always renders the WORD, never a tooltip-only dot.
 */
export type Tone = "alarm" | "warn" | "info" | "ember" | "pass" | "muted";

const TONE: Record<Tone, string> = {
  alarm: "bg-alarm/15 text-fire3 ring-1 ring-inset ring-alarm/30",
  ember: "bg-ember/15 text-[#fb923c] ring-1 ring-inset ring-ember/30",
  warn: "bg-warn/15 text-[#fbbf24] ring-1 ring-inset ring-warn/30",
  info: "bg-info/15 text-[#60a5fa] ring-1 ring-inset ring-info/30",
  pass: "bg-pass/15 text-pass ring-1 ring-inset ring-pass/30",
  muted: "bg-elevated text-muted ring-1 ring-inset ring-border",
};

const DOT: Record<Tone, string> = {
  alarm: "bg-fire3",
  ember: "bg-ember",
  warn: "bg-warn",
  info: "bg-info",
  pass: "bg-pass",
  muted: "bg-muted",
};

export function SeverityBadge({
  label,
  tone,
  size = "md",
  dot = true,
  className,
}: {
  label: string;
  tone: Tone;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium tracking-wide whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-[11.5px]",
        TONE[tone],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOT[tone])} />}
      {label}
    </span>
  );
}
