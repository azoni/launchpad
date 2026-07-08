"use client";
import { useState } from "react";
import type { DummyData } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";

export function BriefingScreen({ data, onDone }: { data: DummyData; onDone: () => void }) {
  const [accepted, setAccepted] = useState(false);

  const intel = [
    { label: "History", body: "Last year: static 64 PSI · residual 50 · recovery 38 s. Zero open deficiencies." },
    { label: "Devices", body: "11 tagged devices on route — riser, flow switch, backflow, PIV, FDC, head surveys, 4 extinguishers." },
    { label: "Access", body: "Garage gate 4471# · riser room behind lobby service corridor · freight elevator key at desk." },
    { label: "Contact", body: `${data.customer.name} — ${data.customer.role}. On site 0800–1600.` },
    { label: "Monitoring", body: "Central station account 4471-ME — live and dispatching." },
  ];

  return (
    <div className="space-y-4">
      <div className="border border-border rounded bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="tactical-label">// Work order</span>
          <span className="text-fire text-[11px] tracking-widest2">WO-2841</span>
        </div>
        <div className="mt-3 text-ink text-[13px] uppercase tracking-wide">{data.site.name}</div>
        <div className="text-faint text-[12px] mt-1">{data.site.address}</div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] tracking-widest2 uppercase">
          <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">NFPA 25 annual</span>
          <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">NFPA 10 round</span>
          <span className="border border-border rounded-sm px-1.5 py-0.5 text-muted">ITM yr 2/3</span>
        </div>
        <div className="mt-3 border-t border-border2 pt-3 text-[12px] text-faint">
          {data.inspector.name} · {data.inspector.certs} · {data.inspector.license}
        </div>
      </div>

      {!accepted ? (
        <button
          onClick={() => {
            haptic();
            setAccepted(true);
            onDone();
          }}
          className="w-full bg-fire hover:bg-fire3 active:scale-[0.98] text-white py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all"
        >
          Accept work order
        </button>
      ) : (
        <div className="animate-fade-up">
          <div className="tactical-label mb-2">// Site intel — swipe</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-1">
            {intel.map((c) => (
              <div key={c.label} className="snap-start shrink-0 w-56 border border-border rounded bg-surface p-3">
                <div className="text-fire text-[11px] tracking-widest2 uppercase">▸ {c.label}</div>
                <p className="mt-2 text-muted text-[12px] leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
