"use client";
import type { DemoDeficiency } from "@/lib/demo/useDeficiencies";

const SEV: Record<NonNullable<DemoDeficiency["severity"]>, { label: string; cls: string }> = {
  critical: { label: "Critical", cls: "text-fire border-fire/40 bg-fire/10" },
  noncritical: { label: "Noncritical", cls: "text-warn border-warn/40 bg-warn/10" },
  impairment: { label: "Impairment", cls: "text-alarm border-alarm/40 bg-alarm/10" },
};
const STATUS: Record<DemoDeficiency["status"], string> = {
  local: "Local · unsynced",
  synced: "Synced",
  quoted: "Quoted",
};

/** Bottom-sheet list of what's been found — reachable anytime after the garage. */
export function DeficiencyTray({
  open,
  onClose,
  deficiencies,
}: {
  open: boolean;
  onClose: () => void;
  deficiencies: DemoDeficiency[];
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-label="Deficiencies">
      <button className="absolute inset-0 bg-black/60" aria-label="Close" onClick={onClose} />
      <div className="relative bg-surface border-t border-border rounded-t-lg max-h-[78%] flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border2">
          <span className="tactical-label">// Deficiencies ({deficiencies.length})</span>
          <button onClick={onClose} className="text-muted hover:text-ink text-[13px] tracking-wide">Done</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {deficiencies.length === 0 && (
            <p className="text-fainter text-[12px] text-center py-6">Nothing logged yet — clean building so far.</p>
          )}
          {deficiencies.map((d) => {
            const sev = d.severity ? SEV[d.severity] : null;
            return (
              <div key={d.id} className="border border-fire/30 rounded bg-[#0a0e14] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fire text-[12px] tracking-widest2">{d.deviceId}</span>
                  {sev && (
                    <span className={`text-[10px] tracking-widest2 uppercase px-1.5 py-0.5 rounded-sm border ${sev.cls}`}>
                      {sev.label}
                    </span>
                  )}
                </div>
                <div className="text-ink text-[13px] mt-1">{d.label}</div>
                <div className="text-fainter text-[11px] mt-0.5 leading-snug">{d.floor} · {d.location}</div>
                {d.historyNote && <div className="text-warn text-[11px] mt-1.5 leading-snug">↳ last year: {d.historyNote}</div>}
                <div className="flex items-center gap-3 mt-2">
                  {d.photo && <span className="text-pass text-[10px] tracking-widest2 uppercase">▣ Photo</span>}
                  <span className="text-muted text-[10px] tracking-widest2 uppercase">{STATUS[d.status]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
