"use client";
import { haptic } from "@/lib/haptics";

/**
 * The one obviously-tappable check-off row used across the demo. A real checkbox (bordered
 * square that fills + checks), a bordered row that reads as pressable, and a hover cue — so
 * testers immediately see "tap this to pass it."
 */
export function CheckRow({
  label,
  checked,
  onCheck,
}: {
  label: string;
  checked: boolean;
  onCheck: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (checked) return;
        haptic(8);
        onCheck();
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded border text-left transition-colors ${
        checked
          ? "border-pass/40 bg-pass/[0.06]"
          : "border-border bg-surface hover:border-fire active:bg-[#0a0e14]"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`w-5 h-5 rounded-[5px] border-2 shrink-0 flex items-center justify-center transition-colors ${
          checked ? "bg-pass border-pass" : "border-muted"
        }`}
      >
        {checked && (
          <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden>
            <polyline
              points="1,5 4.3,8.4 11,1.4"
              stroke="#0a0e14"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className={`text-[12.5px] leading-snug font-sans ${checked ? "text-pass line-through" : "text-ink2"}`}>
        {label}
      </span>
    </button>
  );
}
