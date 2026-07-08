"use client";
import { useMemo, useState } from "react";
import { useWorkspace } from "@/lib/store/workspace";
import { useJobs, PRIORITY_COLOR } from "@/lib/jobs";

// Seattle approx bbox
const BOUNDS = { minLat: 47.57, maxLat: 47.66, minLng: -122.35, maxLng: -122.3 };

function projectPct(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = 100 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}

export default function RoutesPage() {
  const { workspaceId } = useWorkspace();
  const jobs = useJobs(workspaceId);
  const [optimized, setOptimized] = useState(false);

  const ordered = useMemo(() => {
    const valid = jobs.filter((j) => typeof j.lat === "number" && typeof j.lng === "number");
    if (!optimized) return valid;
    // Nearest-neighbor from Downtown Seattle as a simple demo
    const start = { lat: 47.6062, lng: -122.3321 };
    const remaining = [...valid];
    const out: typeof jobs = [];
    let cur = start;
    while (remaining.length) {
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d =
          Math.hypot(remaining[i].lat - cur.lat, remaining[i].lng - cur.lng);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      const n = remaining[best];
      out.push(n);
      cur = { lat: n.lat, lng: n.lng };
      remaining.splice(best, 1);
    }
    return out;
  }, [jobs, optimized]);

  const pins = ordered.map((j, idx) => ({
    ...j,
    order: idx + 1,
    pos: projectPct(j.lat, j.lng),
  }));
  const polylinePoints = pins.map((p) => `${p.pos.x}%,${p.pos.y}%`).join(" ");

  return (
    <div className="p-6 animate-slide-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="font-display text-3xl sm:text-4xl tracking-widest3 text-white">ROUTE OPTIMIZATION</div>
          <div className="text-[11px] tracking-widest2 text-faint uppercase">
            AI-powered Seattle route planning
          </div>
        </div>
        <button
          onClick={() => setOptimized((o) => !o)}
          className="bg-fire hover:bg-fire3 text-white px-5 py-2.5 rounded text-[11px] tracking-widest2 uppercase transition-colors"
        >
          {optimized ? "✓ Optimized" : "⚡ Re-Optimize Route"}
        </button>
      </div>

      <div className="bg-surface2 border border-border rounded h-[340px] sm:h-[420px] relative overflow-hidden mb-5 grid-bg">
        <div className="absolute top-3 left-3 text-[9px] tracking-widest2 text-fainter uppercase">
          SEATTLE, WA // LIVE MAP VIEW
        </div>

        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {pins.length > 1 && (
            <polyline
              points={polylinePoints}
              stroke="#ff4500"
              strokeWidth="2"
              fill="none"
              strokeDasharray="6,3"
              opacity="0.7"
            />
          )}
        </svg>

        {pins.map((p) => (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110"
            style={{ left: `${p.pos.x}%`, top: `${p.pos.y}%` }}
          >
            <div
              className="w-6 h-6 rounded-full rounded-bl-none -rotate-45 flex items-center justify-center text-[10px] font-bold text-black"
              style={{
                background: PRIORITY_COLOR[p.priority],
                boxShadow: `0 0 12px ${PRIORITY_COLOR[p.priority]}88`,
              }}
            >
              <span className="rotate-45">{p.order}</span>
            </div>
            <div className="bg-bg/80 border border-border px-2 py-0.5 text-[9px] tracking-wide rounded-sm mt-1 whitespace-nowrap text-ink">
              {p.name}
            </div>
          </div>
        ))}

        <div className="absolute bottom-3 right-3 bg-bg/80 border border-border px-3 py-2 rounded">
          <div className="text-[9px] text-faint tracking-widest2 mb-1.5">PRIORITY</div>
          {(["Critical", "High", "Medium", "Low"] as const).map((p) => (
            <div key={p} className="flex items-center gap-1.5 text-[9px] text-muted mb-0.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: PRIORITY_COLOR[p] }}
              />
              {p}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Distance", value: "38.2 mi", icon: "◈" },
          { label: "Drive Time", value: "2h 14m", icon: "⏱" },
          { label: "Time Saved", value: optimized ? "47 min" : "—", icon: "⚡" },
          { label: "Fuel Estimate", value: "~3.1 gal", icon: "⛽" },
          { label: "Inspections", value: `${jobs.length} sites`, icon: "✓" },
          { label: "Est. Complete", value: "5:45 PM", icon: "◉" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-surface border border-border rounded p-4 flex items-center gap-3"
          >
            <span className="text-fire text-xl">{s.icon}</span>
            <div className="min-w-0">
              <div className="font-display text-base tracking-widest2 text-ink">{s.value}</div>
              <div className="tactical-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
