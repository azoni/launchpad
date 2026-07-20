"use client";
import { useState } from "react";
import type { Battery, DeviceHistory } from "@/lib/demo/types";

const TREND: Record<NonNullable<DeviceHistory["trendFlag"]>, string> = {
  ok: "text-pass",
  watch: "text-warn",
  worse: "text-fire",
};

const BATTERY_STATUS: Record<Battery["status"], { color: string; label: string }> = {
  ok: { color: "text-pass", label: "OK" },
  "due-soon": { color: "text-warn", label: "DUE" },
  overdue: { color: "text-fire", label: "OVERDUE" },
};

/** Inline, collapsible last-year record on a device card — no navigation, no overlay. */
export function DeviceHistoryPeek({ history, batteries }: { history: DeviceHistory; batteries?: Battery[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-muted hover:text-ink text-[10px] tracking-widest2 uppercase border border-border2 rounded-sm px-2 py-1.5 min-h-[44px] transition-colors"
        aria-expanded={open}
      >
        {open ? "▾ Last yr" : "⌂ Last yr"}
      </button>
      {open && (
        <div className="mt-1.5 border border-border2 rounded bg-[#0a0e14] p-2 space-y-1.5 animate-fade-up w-[210px] max-w-[62vw]">
          <Row label="Last inspected" value={history.lastInspected} />
          <Row
            label="Last reading"
            value={history.lastReading}
            valueClass={history.trendFlag ? TREND[history.trendFlag] : "text-ink2"}
          />
          <Row label="Prior notes" value={history.priorNotes} />
          {batteries && batteries.length > 0 && (
            <div className="pt-1.5 border-t border-border2">
              <div className="text-fainter text-[10px] tracking-widest2 uppercase">Batteries</div>
              {batteries.map((b, i) => {
                const s = BATTERY_STATUS[b.status];
                return (
                  <div key={i} className="mt-1 text-[12px] leading-snug font-sans">
                    <span className="text-ink2">
                      {b.count}× {b.voltage}V {b.ampHours}Ah
                    </span>
                    <span className="text-fainter"> · in {b.installed} · due {b.nextDue} </span>
                    <span className={`${s.color} font-mono text-[10px] tracking-widest2`}>{s.label}</span>
                    {b.lastLoadTest && <div className="text-fainter text-[11px]">load test: {b.lastLoadTest}</div>}
                  </div>
                );
              })}
            </div>
          )}
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
