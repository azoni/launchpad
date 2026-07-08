"use client";
import { useState } from "react";
import type { DummyData } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";

export function OfficeScreen({ data, onDone }: { data: DummyData; onDone: () => void }) {
  const beats = [
    {
      key: "REPORT",
      time: "1152",
      body: `NFPA 25 / NFPA 10 report auto-generated — stamped ${data.inspector.name}, NICET II, ${data.inspector.license}. Emailed to ${data.customer.name}.`,
    },
    {
      key: "AHJ",
      time: "1154",
      body: `Report routed to ${data.ahj.name} via ${data.ahj.portal}. Deficiency flagged — correction deadline clock running.`,
    },
    {
      key: "QUOTE",
      time: "1157",
      body: "Critical deficiency is already a priced head-replacement quote — parts + labor from the pricebook — on a hosted approval link in Dana's inbox.",
    },
    {
      key: "INVOICE",
      time: "1201",
      body: "Today's inspection invoiced. Same day. Truck's still on Western Ave.",
    },
  ];
  const [stamped, setStamped] = useState(0);

  return (
    <div className="space-y-2">
      {beats.map((b, i) => {
        const isStamped = i < stamped;
        const isNext = i === stamped;
        return (
          <button
            key={b.key}
            disabled={!isNext}
            onClick={() => {
              haptic();
              const n = stamped + 1;
              setStamped(n);
              if (n === beats.length) setTimeout(onDone, 350);
            }}
            className={`w-full text-left border rounded p-3 transition-all ${
              isStamped
                ? "border-pass/40 bg-pass/5"
                : isNext
                  ? "border-fire bg-surface active:scale-[0.98] animate-soft-pulse"
                  : "border-border2 bg-surface opacity-40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[12px] tracking-widest2 uppercase ${isStamped ? "text-pass" : "text-fire"}`}>
                {isStamped ? "✓" : "▸"} {b.key}
              </span>
              <span className="text-fainter text-[11px] tracking-widest2">{isStamped ? `DONE ${b.time}` : isNext ? "TAP" : "—"}</span>
            </div>
            <p className={`mt-1.5 text-[12px] leading-relaxed ${isStamped ? "text-ink2" : "text-muted"}`}>{b.body}</p>
          </button>
        );
      })}
      <p className="text-fainter text-[11px] tracking-widest2 uppercase text-center pt-1">Zero humans re-keying</p>
    </div>
  );
}
