"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useWorkspace } from "@/lib/store/workspace";
import { CHECKLIST_ITEMS, type SystemKey } from "@/lib/checklists";
import { TEMPLATE_WORKSPACE_ID } from "@/lib/firebase/collections";
import type { SeedJob } from "@/lib/seed-data";

type ChecklistState = Record<string, boolean>;

export default function InspectRunPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const { workspaceId } = useWorkspace();
  const router = useRouter();
  const [job, setJob] = useState<SeedJob | null>(null);
  const [state, setState] = useState<ChecklistState>({});
  const [saving, setSaving] = useState(false);

  // Job comes from the read-only template workspace
  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, `workspaces/${TEMPLATE_WORKSPACE_ID}/jobs/${slug}`));
      if (snap.exists()) setJob(snap.data() as SeedJob);
    })();
  }, [slug]);

  // Checklist state comes from the user's own workspace
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      const csSnap = await getDoc(doc(db, `workspaces/${workspaceId}/checklistState/${slug}`));
      if (csSnap.exists()) {
        setState((csSnap.data() as { items?: ChecklistState }).items ?? {});
      }
    })();
  }, [workspaceId, slug]);

  const allItems = useMemo(
    () => (job?.systems ?? []).flatMap((s) => CHECKLIST_ITEMS[s as SystemKey] || []),
    [job]
  );

  const completionPct = useMemo(() => {
    if (!job) return 0;
    let total = 0;
    let done = 0;
    for (const s of job.systems ?? []) {
      for (const item of CHECKLIST_ITEMS[s as SystemKey] ?? []) {
        total++;
        if (state[`${s}::${item}`]) done++;
      }
    }
    return total ? Math.round((done / total) * 100) : 0;
  }, [job, state]);

  async function toggleCheck(system: string, item: string) {
    const key = `${system}::${item}`;
    const next = { ...state, [key]: !state[key] };
    setState(next);
    if (workspaceId && job) {
      setSaving(true);
      try {
        await setDoc(
          doc(db, `workspaces/${workspaceId}/checklistState/${job.id}`),
          { jobId: job.id, items: next, updatedAt: Date.now() },
          { merge: true }
        );
      } catch {
        /* persistence is best-effort; demo UI stays responsive */
      } finally {
        setSaving(false);
      }
    }
  }

  if (!job) {
    return (
      <div className="p-6 text-faint text-[11px] tracking-widest2 uppercase">Loading job…</div>
    );
  }

  const complete = completionPct === 100;

  return (
    <div className="p-4 sm:p-6 animate-slide-in max-w-6xl mx-auto">
      <div className="mb-4">
        <div className="font-display text-3xl sm:text-4xl tracking-widest3 text-white">
          INSPECTION CHECKLIST
        </div>
        <div className="text-[11px] tracking-widest2 text-faint uppercase">
          NFPA 72 & IFC Compliant · {allItems.length} items
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="bg-surface border border-border rounded p-4 mb-3">
            <div className="text-[14px] font-semibold text-fire mb-0.5">{job.name}</div>
            <div className="text-[10px] text-muted mb-3">{job.address}</div>
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-faint mb-1.5">
                <span>Progress {saving && <span className="text-fire">· saving</span>}</span>
                <span>{completionPct}%</span>
              </div>
              <div className="h-[3px] bg-border rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-fire to-fire2 transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {(job.systems ?? []).map((s) => (
                <span
                  key={s}
                  className="text-[10px] tracking-wide uppercase px-2 py-0.5 rounded-sm"
                  style={{ background: "#1a2535", color: "#7a9ab0" }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="tactical-label mb-2">Building Info</div>
          <div className="space-y-0">
            {(
              [
                ["Type", job.type],
                ["Priority", job.priority],
                ["Est. Duration", `${job.duration} min`],
                ["Last Inspected", job.lastInspected],
                ["Sq. Ft.", job.squareFeet?.toLocaleString() ?? "—"],
                ["Floors", String(job.floors ?? "—")],
                ["AHJ", job.ahj ?? "—"],
              ] as const
            ).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between py-1.5 border-b border-surface text-[11px]"
              >
                <span className="text-faint">{k}</span>
                <span className="text-muted text-right truncate max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
          <Link
            href="/app/assistant"
            className="block text-center mt-4 bg-fire hover:bg-fire3 text-white px-4 py-2.5 rounded text-[11px] tracking-widest2 uppercase transition-colors"
          >
            Ask AI Assistant →
          </Link>
          <button
            onClick={() => router.push("/app/inspect")}
            className="w-full mt-2 bg-transparent border border-border text-faint px-4 py-2 rounded text-[10px] tracking-widest2 uppercase hover:text-ink transition-colors"
          >
            ← Change Job
          </button>
        </div>

        <div>
          {(job.systems ?? []).map((system) => (
            <div
              key={system}
              className="bg-surface border border-border rounded p-4 mb-3"
            >
              <div className="text-[12px] font-semibold text-fire2 tracking-widest2 uppercase mb-3">
                {system}
              </div>
              {(CHECKLIST_ITEMS[system as SystemKey] ?? []).map((item) => {
                const key = `${system}::${item}`;
                const checked = state[key] ?? false;
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggleCheck(system, item)}
                    className="w-full flex items-start gap-2.5 py-2 border-b border-border2 last:border-0 hover:pl-1.5 transition-[padding] text-left"
                  >
                    <div
                      className={`w-4 h-4 rounded-sm border-[1.5px] shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        checked ? "bg-fire border-fire" : "border-border"
                      }`}
                    >
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8">
                          <polyline points="1,4 4,7 9,1" stroke="#fff" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-[11px] leading-relaxed ${
                        checked ? "text-pass line-through" : "text-muted"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {complete && (
            <Link
              href={`/app/reports?job=${job.id}`}
              className="block text-center bg-fire hover:bg-fire3 text-white px-5 py-3 rounded text-[11px] tracking-widest2 uppercase transition-colors"
            >
              Generate Inspection Report →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
