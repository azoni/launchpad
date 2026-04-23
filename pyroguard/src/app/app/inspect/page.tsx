"use client";
import Link from "next/link";
import { useWorkspace } from "@/lib/store/workspace";
import { useJobs } from "@/lib/jobs";

export default function InspectIndexPage() {
  const { workspaceId } = useWorkspace();
  const jobs = useJobs(workspaceId);

  return (
    <div className="p-6 animate-slide-in max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="font-display text-3xl sm:text-4xl tracking-widest3 text-white">
          INSPECTION CHECKLIST
        </div>
        <div className="text-[11px] tracking-widest2 text-faint uppercase">
          NFPA 72 & IFC Compliant
        </div>
      </div>
      <div className="text-[12px] text-faint mb-4">Select a job to begin inspection:</div>
      <div className="space-y-2">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/app/inspect/${job.id}`}
            className="block bg-surface border border-border rounded p-4 hover:border-fire hover:translate-x-0.5 transition-all"
          >
            <div className="font-semibold text-ink mb-1">{job.name}</div>
            <div className="text-[10px] text-muted tracking-wide">
              {job.address} · {job.type}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
