"use client";
import Link from "next/link";
import { useWorkspace } from "@/lib/store/workspace";
import { useJobs, PRIORITY_COLOR, STATUS_BADGE } from "@/lib/jobs";

export default function DashboardPage() {
  const { workspaceId } = useWorkspace();
  const jobs = useJobs(workspaceId);
  const completed = jobs.filter((j) => j.status === "completed").length;
  const critical = jobs.filter((j) => j.priority === "Critical").length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const optimizedOrder = ["UW Medical Center", "Belltown Hotel", "Amazon Spheres", "Pike Place Market", "Capitol Hill Apartments"];

  return (
    <div className="p-6 animate-slide-in max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="font-display text-3xl sm:text-4xl tracking-widest3 text-white">TODAY&apos;S MISSION</div>
        <div className="text-[11px] tracking-widest2 text-faint uppercase">{today} — Seattle, WA</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Jobs", value: jobs.length, accent: "#ff4500" },
          { label: "Completed", value: completed, accent: "#4ade80" },
          { label: "Critical", value: critical, accent: "#ff2d2d" },
          { label: "Est. Drive Time", value: "2h 14m", accent: "#f5c842" },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded p-4">
            <div className="font-display text-3xl tracking-widest2" style={{ color: s.accent }}>
              {s.value}
            </div>
            <div className="tactical-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="tactical-label mb-3">Job Queue</div>
          <div className="space-y-2">
            {jobs.map((job) => {
              const badge = STATUS_BADGE[job.status];
              return (
                <Link
                  key={job.id}
                  href={`/app/inspect/${job.id}`}
                  className="block bg-surface border border-border rounded p-4 hover:border-fire hover:translate-x-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-ink truncate">{job.name}</div>
                      <div className="text-[10px] text-muted tracking-wide truncate">{job.address}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {badge && (
                        <span
                          className="px-2 py-0.5 rounded-sm text-[10px] tracking-widest uppercase"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                      )}
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: PRIORITY_COLOR[job.priority] }}
                        title={job.priority}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 text-[10px] text-muted">
                    <span>⏱ {job.duration ?? "—"}min</span>
                    <span>🔧 {(job.systems?.length ?? 0)} systems</span>
                    <span>📋 {job.type ?? "—"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="bg-surface border border-border rounded p-5 h-fit">
          <div className="tactical-label mb-4">AI Route Summary</div>
          <div className="bg-bg border border-border rounded p-3.5 mb-4">
            <div className="text-fire text-[10px] tracking-widest2 mb-2">◉ OPTIMIZED FOR TODAY</div>
            {optimizedOrder.map((name, i) => (
              <div
                key={name}
                className="flex items-center gap-2.5 py-1.5 border-b border-border2 last:border-0"
              >
                <span className="text-fire text-[10px] min-w-[16px]">{i + 1}.</span>
                <span className={`text-[11px] ${i === 0 ? "text-fire" : "text-muted"}`}>{name}</span>
                {i === 0 && (
                  <span className="animate-soft-pulse text-fire text-[9px] tracking-widest2 ml-auto">
                    NEXT
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="text-[11px] text-pass tracking-wide">
            ✓ Saved 47 minutes vs. default order
          </div>
          <div className="text-[11px] text-faint mt-1">Est. completion: 5:45 PM</div>
          <Link
            href="/app/routes"
            className="w-full mt-4 bg-fire hover:bg-fire3 text-white px-5 py-2.5 rounded text-[11px] tracking-widest2 uppercase transition-colors flex items-center justify-center"
          >
            View Full Route →
          </Link>
        </div>
      </div>
    </div>
  );
}
