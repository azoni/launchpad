"use client";
import type { PainPoint } from "@/lib/demo/types";

export function PainPointCard({ painPoint }: { painPoint: PainPoint }) {
  return (
    <div className="animate-fade-up border border-border rounded bg-surface overflow-hidden">
      <div className="px-4 py-2 border-b border-border bg-[#0a0e14] flex items-center gap-2">
        <span className="text-warn">⚡</span>
        <span className="tactical-label text-warn">// Pain point: {painPoint.title}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="border-l-2 border-alarm/60 pl-3">
          <div className="text-[11px] tracking-widest2 uppercase text-alarm/80 mb-1">The old way</div>
          <p className="text-muted text-[12.5px] leading-relaxed font-sans">{painPoint.oldWay}</p>
        </div>
        <div className="border-l-2 border-fire pl-3">
          <div className="text-[11px] tracking-widest2 uppercase text-fire mb-1">PyroGuard</div>
          <p className="text-ink2 text-[12.5px] leading-relaxed font-sans">{painPoint.fix}</p>
        </div>
        {painPoint.stat && (
          <p className="text-faint text-[12px] leading-relaxed font-sans border-t border-border2 pt-2">▸ {painPoint.stat}</p>
        )}
      </div>
    </div>
  );
}
