"use client";
import Link from "next/link";
import { useMemo } from "react";
import { MapPin, Clock, ArrowUpRight, ChevronRight } from "lucide-react";
import { useWorkspace } from "@/lib/store/workspace";
import { useJobs, PRIORITY_TONE, STATUS_BADGE } from "@/lib/jobs";
import type { SeedJob } from "@/lib/seed-data";
import { SeverityBadge } from "@/components/ui/severity-badge";

const STATUS_ORDER: Record<SeedJob["status"], number> = { "in-progress": 0, pending: 1, completed: 2 };

export default function TodaysJobsPage() {
  const { workspaceId } = useWorkspace();
  const jobs = useJobs(workspaceId);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const sorted = useMemo(
    () => [...jobs].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
    [jobs]
  );
  const active = sorted.filter((j) => j.status !== "completed");
  const completed = sorted.filter((j) => j.status === "completed");
  const criticalCount = jobs.filter((j) => j.priority === "Critical").length;

  return (
    <div className="px-5 sm:px-8 py-8 max-w-5xl mx-auto animate-slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="eyebrow mb-2" suppressHydrationWarning>{today} · Seattle</div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink font-semibold tracking-tight">
            Today&apos;s jobs
          </h1>
          <p className="text-[13.5px] text-muted mt-1.5">
            {active.length} to run · {completed.length} done
            {criticalCount > 0 && <> · <span className="text-fire3">{criticalCount} critical</span></>}
          </p>
        </div>
        <Link
          href="/app/dashboard"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[12.5px] text-muted hover:text-ink hover:border-muted transition-colors"
        >
          Operations dashboard <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {jobs.length === 0 && (
        <div className="bg-surface border border-border rounded-lg px-5 py-16 text-center text-muted text-[13px]">
          Loading today&apos;s route…
        </div>
      )}

      {active.length > 0 && (
        <>
          <div className="tactical-label mb-2">On the board</div>
          <div className="space-y-2 mb-8">
            {active.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <div className="tactical-label mb-2">Completed</div>
          <div className="space-y-2">
            {completed.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        </>
      )}
    </div>
  );
}

function JobCard({ job }: { job: SeedJob }) {
  const sb = STATUS_BADGE[job.status];
  return (
    <Link
      href={`/app/inspect/${job.id}`}
      className="flex items-center gap-4 bg-surface border border-border rounded-lg px-4 py-3.5 hover:border-fire/40 hover:bg-elevated transition-all group"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[15px] font-semibold text-ink truncate group-hover:text-fire3 transition-colors">
            {job.name}
          </span>
          {PRIORITY_TONE[job.priority] && (
            <SeverityBadge {...PRIORITY_TONE[job.priority]} size="sm" />
          )}
        </div>
        <div className="flex items-center gap-3 text-[12.5px] text-muted">
          <span className="inline-flex items-center gap-1 min-w-0 truncate">
            <MapPin className="h-3 w-3 shrink-0 text-faint" /> {job.address}
          </span>
          <span className="inline-flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3 text-faint" /> {job.duration} min
          </span>
        </div>
      </div>
      {sb && (
        <span
          className="text-[10.5px] tracking-wide font-medium px-2 py-0.5 rounded-md shrink-0"
          style={{ background: sb.bg, color: sb.text }}
        >
          {sb.label}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-faint shrink-0 group-hover:text-ink transition-colors" />
    </Link>
  );
}
