"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useWorkspace } from "@/lib/store/workspace";
import {
  CHECKLIST_ITEMS, EXTINGUISHER_MAINTENANCE, itemWidget, type SystemKey,
} from "@/lib/checklists";
import { PRIORITY_TONE } from "@/lib/jobs";
import { TEMPLATE_WORKSPACE_ID } from "@/lib/firebase/collections";
import type { SeedJob } from "@/lib/seed-data";
import { CriticalBanner } from "@/components/ui/critical-banner";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { GaugeField } from "@/components/inspect/GaugeField";
import { TimedTestField } from "@/components/inspect/TimedTestField";

type ItemState = { done: boolean; value?: number };
type ChecklistState = Record<string, ItemState>;

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

  // Checklist state comes from the user's own workspace (back-compat: old boolean values → {done})
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      const csSnap = await getDoc(doc(db, `workspaces/${workspaceId}/checklistState/${slug}`));
      if (csSnap.exists()) {
        const raw = (csSnap.data() as { items?: Record<string, boolean | ItemState> }).items ?? {};
        const norm: ChecklistState = {};
        for (const [k, v] of Object.entries(raw)) norm[k] = typeof v === "boolean" ? { done: v } : v;
        setState(norm);
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
        if (state[`${s}::${item}`]?.done) done++;
      }
    }
    return total ? Math.round((done / total) * 100) : 0;
  }, [job, state]);

  async function persist(next: ChecklistState) {
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

  const toggle = (key: string) =>
    persist({ ...state, [key]: { ...state[key], done: !(state[key]?.done ?? false) } });
  const logValue = (key: string, value: number) =>
    persist({ ...state, [key]: { done: true, value } });

  if (!job) {
    return <div className="p-6 text-muted text-[13px] tracking-wide">Loading job…</div>;
  }

  const complete = completionPct === 100;

  return (
    <div className="p-4 sm:p-6 animate-slide-in max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="font-display text-3xl sm:text-4xl tracking-tight text-ink font-semibold">
          Inspection checklist
        </h1>
        <div className="text-[12px] tracking-widest2 text-muted uppercase mt-1">
          NFPA 72 &amp; IFC Compliant · {allItems.length} items
        </div>
      </div>

      {job.priority === "Critical" && (
        <CriticalBanner
          className="mb-4"
          title={`Critical priority — ${job.name}`}
          detail="This site is flagged critical. Confirm life-safety systems first and escalate any failure immediately."
        />
      )}

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="bg-surface border border-border rounded p-4 mb-3">
            <div className="text-[15px] font-semibold text-ink mb-0.5">{job.name}</div>
            <div className="text-[13px] text-muted mb-3">{job.address}</div>
            <div className="mb-3">
              <div className="flex justify-between text-[12px] text-muted mb-1.5">
                <span>Progress {saving && <span className="text-fire3">· saving</span>}</span>
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
                  className="text-[11px] tracking-wide uppercase px-2 py-0.5 rounded-sm bg-elevated text-ink2"
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
                [
                  "Priority",
                  PRIORITY_TONE[job.priority] ? (
                    <SeverityBadge key="p" {...PRIORITY_TONE[job.priority]} size="sm" />
                  ) : (
                    job.priority
                  ),
                ],
                ["Est. Duration", `${job.duration} min`],
                ["Last Inspected", job.lastInspected],
                ["Sq. Ft.", job.squareFeet?.toLocaleString() ?? "—"],
                ["Floors", String(job.floors ?? "—")],
                ["AHJ", job.ahj ?? "—"],
              ] as [string, ReactNode][]
            ).map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between items-center gap-2 py-1.5 border-b border-border2 text-[13px]"
              >
                <span className="text-muted shrink-0">{k}</span>
                <span className="text-ink2 text-right truncate">{v}</span>
              </div>
            ))}
          </div>
          <Link
            href="/app/assistant"
            className="block text-center mt-4 bg-fire hover:bg-fire3 text-white px-4 py-2.5 rounded text-[12px] tracking-widest2 uppercase transition-colors"
          >
            Ask AI Assistant →
          </Link>
          <button
            onClick={() => router.push("/app/inspect")}
            className="w-full mt-2 bg-transparent border border-border text-muted px-4 py-2 rounded text-[12px] tracking-widest2 uppercase hover:text-ink transition-colors"
          >
            ← Change Job
          </button>
        </div>

        <div>
          {(job.systems ?? []).map((system) => (
            <div key={system} className="bg-surface border border-border rounded p-4 mb-3">
              <div className="text-[12px] font-semibold text-fire3 tracking-widest2 uppercase mb-3">
                {system}
              </div>
              {(CHECKLIST_ITEMS[system as SystemKey] ?? []).map((item) => {
                const key = `${system}::${item}`;
                const st = state[key];
                const done = st?.done ?? false;
                const widget = itemWidget(item);

                if (widget === "gauge") {
                  return (
                    <div key={item} className="py-2 border-b border-border2 last:border-0">
                      <div className="text-[15px] text-ink2 leading-relaxed">{item}</div>
                      <GaugeField
                        label={item}
                        unit="PSI"
                        min={0}
                        max={300}
                        value={st?.value}
                        done={done}
                        onLog={(v) => logValue(key, v)}
                      />
                    </div>
                  );
                }
                if (widget === "timer") {
                  return (
                    <div key={item} className="py-2 border-b border-border2 last:border-0">
                      <div className="text-[15px] text-ink2 leading-relaxed">{item}</div>
                      <TimedTestField
                        label={item}
                        value={st?.value}
                        done={done}
                        onLog={(v) => logValue(key, v)}
                        nfpaLimit={90}
                      />
                    </div>
                  );
                }

                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => toggle(key)}
                    className="w-full flex items-start gap-2.5 py-2 border-b border-border2 last:border-0 hover:pl-1.5 transition-[padding] text-left"
                  >
                    <div
                      className={`w-4 h-4 rounded-sm border-[1.5px] shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        done ? "bg-fire border-fire" : "border-border"
                      }`}
                    >
                      {done && (
                        <svg width="10" height="8" viewBox="0 0 10 8">
                          <polyline points="1,4 4,7 9,1" stroke="#fff" strokeWidth="1.5" fill="none" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-[15px] leading-relaxed ${
                        done ? "text-pass line-through" : "text-ink2"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}

              {system === "Fire Extinguisher" && (
                <MaintenanceBlock state={state} onToggle={toggle} />
              )}
            </div>
          ))}
          {complete && (
            <Link
              href={`/app/reports?job=${job.id}`}
              className="block text-center bg-fire hover:bg-fire3 text-white px-5 py-3 rounded text-[12px] tracking-widest2 uppercase transition-colors"
            >
              Generate Inspection Report →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/** Optional annual-maintenance steps for extinguishers — collapsed by default, excluded from completion. */
function MaintenanceBlock({
  state,
  onToggle,
}: {
  state: ChecklistState;
  onToggle: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const doneCount = EXTINGUISHER_MAINTENANCE.filter(
    (m) => state[`Fire Extinguisher::maint::${m}`]?.done
  ).length;

  return (
    <div className="mt-3 border-t border-border2 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 text-[12px] tracking-widest2 uppercase text-muted hover:text-ink transition-colors"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        Annual maintenance (optional)
        <span className="ml-auto text-faint normal-case tracking-normal text-[11px]">
          {doneCount}/{EXTINGUISHER_MAINTENANCE.length}
        </span>
      </button>
      {open && (
        <div className="mt-2">
          <p className="text-[12px] text-faint leading-relaxed mb-1">
            The annual inspection above is the standard round. Expand only when performing full NFPA 10
            maintenance (internal exam, new tag, hydro dates).
          </p>
          {EXTINGUISHER_MAINTENANCE.map((m) => {
            const key = `Fire Extinguisher::maint::${m}`;
            const done = state[key]?.done ?? false;
            return (
              <button
                type="button"
                key={m}
                onClick={() => onToggle(key)}
                className="w-full flex items-start gap-2.5 py-2 border-b border-border2 last:border-0 hover:pl-1.5 transition-[padding] text-left"
              >
                <div
                  className={`w-4 h-4 rounded-sm border-[1.5px] shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    done ? "bg-fire border-fire" : "border-border"
                  }`}
                >
                  {done && (
                    <svg width="10" height="8" viewBox="0 0 10 8">
                      <polyline points="1,4 4,7 9,1" stroke="#fff" strokeWidth="1.5" fill="none" />
                    </svg>
                  )}
                </div>
                <span className={`text-[15px] leading-relaxed ${done ? "text-pass line-through" : "text-ink2"}`}>
                  {m}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
