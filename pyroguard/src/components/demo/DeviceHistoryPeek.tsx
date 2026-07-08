"use client";
import { useState } from "react";
import type { DeviceHistory } from "@/lib/demo/types";

const TREND: Record<NonNullable<DeviceHistory["trendFlag"]>, string> = {
  ok: "text-pass",
  watch: "text-warn",
  worse: "text-fire",
};

/** Inline, collapsible last-year record on a device card — no navigation, no overlay. */
export function DeviceHistoryPeek({ history }: { history: DeviceHistory }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-muted hover:text-ink text-[10px] tracking-widest2 uppercase border border-border2 rounded-sm px-2 py-1.5 min-h-[36px] transition-colors"
        aria-expanded={open}
      >
        {open ? "▾ Last yr" : "⌂ Last yr"}
      </button>
      {open && (
        <div className="mt-1.5 border border-border2 rounded bg-[#0a0e14] p-2 space-y-1.5 animate-fade-up w-[200px] max-w-[60vw]">
          <Row label="Last inspected" value={history.lastInspected} />
          <Row
            label="Last reading"
            value={history.lastReading}
            valueClass={history.trendFlag ? TREND[history.trendFlag] : "text-ink2"}
          />
          <Row label="Prior notes" value={history.priorNotes} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass = "text-ink2" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <div className="text-fainter text-[10px] tracking-widest2 uppercase">{label}</div>
      <div className={`text-[12px] leading-snug font-sans ${valueClass}`}>{value}</div>
    </div>
  );
}
