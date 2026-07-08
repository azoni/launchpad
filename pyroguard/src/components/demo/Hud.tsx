"use client";
import Link from "next/link";

function SignalBars({ offline }: { offline: boolean }) {
  if (offline) {
    return (
      <span className="flex items-center gap-1.5 text-alarm animate-soft-pulse">
        <span className="flex items-end gap-[2px]" aria-hidden>
          {[4, 7, 10, 13].map((h) => (
            <span key={h} className="w-[3px] bg-fainter" style={{ height: h }} />
          ))}
        </span>
        <span className="text-[11px] tracking-widest2 uppercase">No signal</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-pass">
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[4, 7, 10, 13].map((h) => (
          <span key={h} className="w-[3px] bg-pass" style={{ height: h }} />
        ))}
      </span>
      <span className="text-[11px] tracking-widest2 uppercase">LTE</span>
    </span>
  );
}

export function Hud({
  phase,
  stepIndex,
  stepCount,
  stepPhases = [],
  offline,
  unsynced,
  notesCount,
  deficiencyCount,
  onOpenNotes,
  onOpenDeficiencies,
}: {
  phase: string;
  stepIndex: number;
  stepCount: number;
  /** per-step phase labels, so the progress bar reads as four chapters */
  stepPhases?: string[];
  offline: boolean;
  unsynced: number;
  notesCount: number;
  deficiencyCount: number;
  onOpenNotes: () => void;
  onOpenDeficiencies: () => void;
}) {
  return (
    <div className="shrink-0 border-b border-border bg-[#0a0e14] safe-top">
      <div className="flex items-center justify-between px-4 h-10 gap-2">
        <span className="tactical-label truncate">// {phase}</span>
        <div className="flex items-center gap-2.5 shrink-0">
          {deficiencyCount > 0 && (
            <button
              onClick={onOpenDeficiencies}
              className="text-fire text-[11px] tracking-widest2 uppercase border border-fire/40 rounded-sm px-1.5 py-0.5 animate-soft-pulse"
              aria-label={`${deficiencyCount} deficiencies logged`}
            >
              ⚠ {deficiencyCount}
            </button>
          )}
          {unsynced > 0 && (
            <span className="text-warn text-[11px] tracking-widest2 uppercase border border-warn/40 rounded-sm px-1.5 py-0.5">
              ⬆ {unsynced}
            </span>
          )}
          <button
            onClick={onOpenNotes}
            className="text-muted hover:text-ink text-[11px] tracking-widest2 uppercase border border-border2 rounded-sm px-1.5 py-0.5 transition-colors"
            aria-label="Open field notes"
          >
            ⊞ {notesCount > 0 ? notesCount : "Notes"}
          </button>
          <SignalBars offline={offline} />
          <Link href="/" aria-label="Exit demo" className="text-fainter hover:text-ink text-[13px] pl-0.5">
            ✕
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 pb-2">
        <div className="flex gap-[3px] flex-1" aria-hidden>
          {Array.from({ length: stepCount }, (_, i) => {
            const newPhase = i > 0 && !!stepPhases[i] && stepPhases[i] !== stepPhases[i - 1];
            return (
              <span
                key={i}
                className={`h-[3px] flex-1 rounded-sm transition-colors ${newPhase ? "ml-1.5" : ""} ${
                  i < stepIndex ? "bg-fire" : i === stepIndex ? "bg-fire2 animate-soft-pulse" : "bg-border"
                }`}
              />
            );
          })}
        </div>
        <span className="text-fainter text-[10px] tracking-widest2 uppercase shrink-0 tabular-nums">
          {stepIndex + 1}/{stepCount}
        </span>
      </div>
    </div>
  );
}
