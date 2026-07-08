"use client";
import Link from "next/link";
import { useWorkspace } from "@/lib/store/workspace";
import { useJobs, PRIORITY_TONE } from "@/lib/jobs";
import { SeverityBadge } from "@/components/ui/severity-badge";

export default function InspectIndexPage() {
  const { workspaceId } = useWorkspace();
  const jobs = useJobs(workspaceId);

  return (
    <div className="p-6 animate-slide-in max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-ink font-semibold">
          Inspection checklist
        </h1>
        <div className="text-[12px] tracking-widest2 text-muted uppercase mt-1">
          NFPA 72 &amp; IFC Compliant
        </div>
      </div>
      <div className="text-[13px] text-muted mb-4">Select a job to begin inspection:</div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/app/inspect/${job.id}`}
            className="flex items-center justify-between gap-3 bg-surface border border-border rounded p-4 hover:border-fire hover:translate-x-0.5 transition-all"
          >
            <div className="min-w-0">
              <div className="font-semibold text-[15px] text-ink mb-1 truncate">{job.name}</div>
              <div className="text-[13px] text-muted truncate">
                {job.address} · {job.type}
              </div>
            </div>
            {PRIORITY_TONE[job.priority] && (
              <SeverityBadge {...PRIORITY_TONE[job.priority]} size="sm" className="shrink-0" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
