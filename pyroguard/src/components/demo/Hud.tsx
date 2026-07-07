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
        <span className="text-[9px] tracking-widest2 uppercase">No signal</span>
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
      <span className="text-[9px] tracking-widest2 uppercase">LTE</span>
    </span>
  );
}

export function Hud({
  phase,
  stepIndex,
  stepCount,
  offline,
  unsynced,
}: {
  phase: string;
  stepIndex: number;
  stepCount: number;
  offline: boolean;
  unsynced: number;
}) {
  return (
    <div className="shrink-0 border-b border-border bg-[#0a0e14] safe-top">
      <div className="flex items-center justify-between px-4 h-9">
        <span className="tactical-label">// {phase}</span>
        <div className="flex items-center gap-3">
          {unsynced > 0 && (
            <span className="text-warn text-[9px] tracking-widest2 uppercase border border-warn/40 rounded-sm px-1.5 py-0.5">
              ⬆ {unsynced} unsynced
            </span>
          )}
          <SignalBars offline={offline} />
          <Link href="/" aria-label="Exit demo" className="text-fainter hover:text-ink text-[11px] pl-1">
            ✕
          </Link>
        </div>
      </div>
      <div className="flex gap-[3px] px-4 pb-2" aria-hidden>
        {Array.from({ length: stepCount }, (_, i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-sm transition-colors ${
              i < stepIndex ? "bg-fire" : i === stepIndex ? "bg-fire2 animate-soft-pulse" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
