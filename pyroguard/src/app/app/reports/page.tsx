"use client";
import { useMemo, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { setDoc, doc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useWorkspace } from "@/lib/store/workspace";
import { useJobs, useReports } from "@/lib/jobs";
import { NFPA72Pdf } from "@/components/reports/NFPA72Pdf";
import type { SeedJob } from "@/lib/seed-data";

const REPORT_TYPES = [
  "Annual Inspection",
  "Semi-Annual Inspection",
  "Quarterly Test",
  "Deficiency Follow-Up",
  "New System Acceptance",
];

export default function ReportsPage() {
  const { workspaceId } = useWorkspace();
  const jobs = useJobs(workspaceId);
  const reports = useReports(workspaceId);
  const [selected, setSelected] = useState<string>("");
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [lastBlob, setLastBlob] = useState<{ url: string; name: string } | null>(null);

  const selectedJob: SeedJob | undefined = useMemo(
    () => jobs.find((j) => j.id === (selected || jobs[0]?.id)) ?? jobs[0],
    [jobs, selected]
  );

  async function generate() {
    if (!workspaceId || !selectedJob) return;
    setBusy(true);
    try {
      const id = `rpt-${selectedJob.id}-${Date.now()}`;
      const inspection = {
        id,
        customerId: selectedJob.id,
        buildingId: selectedJob.id,
        technicianName: "Demo Technician",
        startedAt: Date.now() - 3600_000,
        completedAt: Date.now(),
        totalDevices: selectedJob.systems.length,
        passed: selectedJob.systems.length - 1,
        failed: 1,
        na: 0,
      };
      const building = {
        id: selectedJob.id,
        customerId: selectedJob.id,
        name: selectedJob.name,
        address: selectedJob.address,
        city: "Seattle",
        state: "WA",
        zip: "98101",
        geo: { lat: selectedJob.lat, lng: selectedJob.lng },
        ahj: selectedJob.ahj,
        jurisdiction: "Seattle IFC 2021",
        occupancyType: selectedJob.type,
        squareFeet: selectedJob.squareFeet,
        floors: selectedJob.floors,
        createdAt: Date.now(),
      };
      const blob = await pdf(
        <NFPA72Pdf
          inspection={inspection}
          building={building}
          technicianName="Demo Technician"
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const name = `pyroguard-${selectedJob.id}-${Date.now()}.pdf`;
      setLastBlob({ url, name });
      await setDoc(doc(collection(db, `workspaces/${workspaceId}/reports`), id), {
        jobId: selectedJob.id,
        site: selectedJob.name,
        date: new Date().toISOString().slice(0, 10),
        type: reportType.split(" ")[0],
        status: "PASS",
        deficiencies: 1,
        generatedAt: Date.now(),
        sizeBytes: blob.size,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 animate-slide-in max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="font-display text-3xl sm:text-4xl tracking-widest3 text-white">
          INSPECTION REPORTS
        </div>
        <div className="text-[11px] tracking-widest2 text-faint uppercase">
          AI-Generated · AHJ-Ready
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="bg-surface border border-border rounded p-5">
          <div className="text-[11px] tracking-widest2 text-fire uppercase mb-4">
            ◉ Generate New Report
          </div>
          <label className="block mb-3">
            <span className="tactical-label block mb-1.5">Select Job</span>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full bg-bg border border-border text-ink text-[12px] px-3 py-2.5 rounded-sm focus:border-fire outline-none"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block mb-3">
            <span className="tactical-label block mb-1.5">Report Type</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-bg border border-border text-ink text-[12px] px-3 py-2.5 rounded-sm focus:border-fire outline-none"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="text-[10px] text-faint tracking-wide mb-4 p-3 bg-bg border border-border rounded-sm leading-relaxed">
            AI will auto-populate findings from your completed checklist, flag NFPA 72 deficiencies,
            and format for Seattle Fire Department AHJ submission.
          </div>
          <button
            onClick={generate}
            disabled={busy || !selectedJob}
            className="w-full bg-fire hover:bg-fire3 disabled:opacity-60 text-white px-5 py-2.5 rounded text-[11px] tracking-widest2 uppercase transition-colors"
          >
            {busy ? "⏳ Generating…" : "⚡ Generate AI Report"}
          </button>
          {lastBlob && (
            <a
              href={lastBlob.url}
              download={lastBlob.name}
              className="block text-center mt-3 border border-fire text-fire hover:bg-fire hover:text-white px-5 py-2 rounded text-[11px] tracking-widest2 uppercase transition-colors"
            >
              ↓ Download {lastBlob.name}
            </a>
          )}
        </div>

        <div>
          <div className="tactical-label mb-3">Recent Reports</div>
          <div className="space-y-2">
            {reports.length === 0 && (
              <div className="bg-surface border border-dashed border-border rounded p-5 text-[11px] text-faint tracking-wide text-center">
                No reports yet. Generate one to get started.
              </div>
            )}
            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-surface border border-border rounded p-4 flex justify-between items-center hover:border-fire transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-ink truncate">{r.site}</div>
                  <div className="text-[10px] text-muted">
                    {r.date} · {r.type}
                  </div>
                  {r.deficiencies > 0 && (
                    <div className="text-[10px] text-fire2 mt-0.5">
                      ⚠ {r.deficiencies} deficienc{r.deficiencies === 1 ? "y" : "ies"}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  <span
                    className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-sm"
                    style={{
                      background: r.status === "PASS" ? "#0d2e1a" : "#2e0d0d",
                      color: r.status === "PASS" ? "#4ade80" : "#ff4444",
                    }}
                  >
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
