"use client";
import type { PainPoint } from "@/lib/demo/types";
import { PainPointCard } from "@/components/demo/PainPointCard";
import { haptic } from "@/lib/haptics";

/**
 * Common chrome for one step: title + narrative, the interaction area,
 * then (once the interaction is complete) the pain-point card and CONTINUE.
 */
export function StepFrame({
  title,
  narrative,
  interaction,
  done,
  painPoint,
  onContinue,
  continueLabel = "Continue →",
  children,
}: {
  title: string;
  narrative: string;
  interaction?: string;
  done: boolean;
  painPoint?: PainPoint;
  onContinue: () => void;
  continueLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 p-4 animate-slide-in">
      <div>
        <h2 className="text-ink text-[16px] uppercase tracking-widest2 leading-snug">{title}</h2>
        <p className="mt-2 text-ink2 text-[13.5px] leading-relaxed">{narrative}</p>
        {!done && interaction && (
          <div className="mt-3 flex items-start gap-2 border border-fire/25 bg-fire/5 rounded px-2.5 py-2">
            <span className="text-fire text-[11px] tracking-widest2 uppercase shrink-0 mt-[1px]">▸ Do</span>
            <span className="text-ink2 text-[12.5px] leading-snug">{interaction}</span>
          </div>
        )}
      </div>

      <div>{children}</div>

      {done && (
        <div className="space-y-4">
          {painPoint && <PainPointCard painPoint={painPoint} />}
          <button
            onClick={() => {
              haptic();
              onContinue();
            }}
            className="w-full bg-fire hover:bg-fire3 active:scale-[0.98] text-white py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all"
          >
            {continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}
