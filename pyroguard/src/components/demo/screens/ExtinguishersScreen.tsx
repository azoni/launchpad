"use client";
import { useEffect, useRef, useState } from "react";
import type { Device } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";
import { DeviceHistoryPeek } from "@/components/demo/DeviceHistoryPeek";
import { CheckRow } from "@/components/demo/CheckRow";

function BarcodeScan({ deviceId, onScanned }: { deviceId: string; onScanned: () => void }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done" | "offroute">("idle");
  const [manual, setManual] = useState(false);
  const [tag, setTag] = useState("");

  const runScan = () => {
    haptic();
    setPhase("scanning");
    setTimeout(() => {
      setPhase("done");
      haptic(25);
      onScanned();
    }, 1100);
  };

  const submitManual = () => {
    const t = tag.trim().toUpperCase();
    if (!t) return;
    haptic(25);
    setTag(t);
    // A tag that isn't the one on the route = a swapped/added unit — the app takes it anyway.
    setPhase(t === deviceId.toUpperCase() ? "done" : "offroute");
    onScanned();
  };

  if (phase === "done" || phase === "offroute") {
    const off = phase === "offroute";
    return (
      <div className={`w-full border rounded p-3 ${off ? "border-warn/50 bg-warn/5" : "border-pass/50 bg-pass/5"}`}>
        <span className={`text-[12px] tracking-widest2 uppercase ${off ? "text-warn" : "text-pass"}`}>
          {off ? `⚠ ${tag} — off-route unit, added to job` : `✓ ${deviceId} verified on route`}
        </span>
      </div>
    );
  }

  return (
    <div>
      <button
        disabled={phase === "scanning"}
        onClick={runScan}
        className="relative w-full overflow-hidden border rounded p-3 text-left transition-colors border-border hover:border-fire"
      >
        <div className="flex items-center gap-3">
          <span className="flex gap-[2px]" aria-hidden>
            {[3, 1, 2, 1, 3, 2, 1, 3, 1, 2].map((w, i) => (
              <span key={i} className="h-8 bg-ink" style={{ width: w }} />
            ))}
          </span>
          <span className="text-[12px] tracking-widest2 uppercase text-ink2">
            {phase === "scanning" ? "Scanning…" : `Scan barcode — ${deviceId}`}
          </span>
        </div>
        {phase === "scanning" && (
          <span className="absolute inset-y-0 left-0 w-0.5 bg-fire shadow-[0_0_12px_2px_rgba(255,69,0,0.8)] animate-[scanline_1.1s_linear]" />
        )}
      </button>

      {phase === "idle" &&
        (!manual ? (
          <button
            onClick={() => setManual(true)}
            className="mt-1.5 text-fainter text-[11px] tracking-widest2 uppercase hover:text-ink underline underline-offset-2"
          >
            Can&apos;t scan / different unit? Enter tag →
          </button>
        ) : (
          <div className="mt-2">
            <div className="flex gap-2">
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitManual();
                }}
                placeholder="Tag # — e.g. FE-L3-04"
                className="flex-1 bg-surface border border-border rounded px-2.5 py-2 text-[12px] text-ink uppercase placeholder:text-fainter outline-none focus:border-fire"
                aria-label="Enter extinguisher tag manually"
              />
              <button
                onClick={submitManual}
                disabled={!tag.trim()}
                className="bg-fire text-white px-3 rounded text-[11px] tracking-widest2 uppercase disabled:opacity-40"
              >
                Log
              </button>
            </div>
            <p className="mt-1 text-fainter text-[10px] leading-snug font-sans">
              A unit that isn&apos;t on the route logs as an off-route find — the AHJ never sees a gap.
            </p>
          </div>
        ))}
    </div>
  );
}

// NFPA 10 annual INSPECTION = the quick visual check (much shorter than maintenance).
const INSPECTION_ROWS = [
  "Gauge reads in operable (green) range",
  "Pull-pin & tamper seal intact",
  "No damage, corrosion, or leakage",
  "Access clear; signage visible",
  "Inspection tag legible & current",
];

export function ExtinguishersScreen({
  survey,
  extinguisher,
  onDone,
}: {
  survey: Device;
  extinguisher: Device;
  onDone: () => void;
}) {
  const surveyRows = survey.checklistItems ?? [];
  const maintRows = extinguisher.checklistItems ?? []; // fuller annual maintenance — optional
  const [surveyChecked, setSurveyChecked] = useState<Record<number, boolean>>({});
  const [scanned, setScanned] = useState(false);
  const [inspDone, setInspDone] = useState<Record<number, boolean>>({});
  const [showMaint, setShowMaint] = useState(false);
  const [maintDone, setMaintDone] = useState<Record<number, boolean>>({});
  const finished = useRef(false);

  const surveyComplete = surveyRows.length > 0 && surveyRows.every((_, i) => surveyChecked[i]);
  const inspectionComplete = scanned && INSPECTION_ROWS.every((_, i) => inspDone[i]);

  useEffect(() => {
    if (surveyComplete && inspectionComplete && !finished.current) {
      finished.current = true;
      setTimeout(onDone, 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyComplete, inspectionComplete]);

  return (
    <div className="space-y-3">
      <div className={`border rounded bg-surface ${surveyComplete ? "border-pass/40" : "border-border"}`}>
        <div className="px-3 py-2 border-b border-border2 flex items-center justify-between">
          <div>
            <span className="text-fire text-[12px] tracking-widest2">{survey.id}</span>
            <div className="text-ink text-[11px] uppercase tracking-wide">{survey.label}</div>
          </div>
          {surveyComplete && <span className="text-pass text-[12px] tracking-widest2">✓ PASS</span>}
        </div>
        <div className="p-2 space-y-1.5">
          {surveyRows.map((row, i) => (
            <CheckRow
              key={row}
              label={row}
              checked={!!surveyChecked[i]}
              onCheck={() => setSurveyChecked((m) => ({ ...m, [i]: true }))}
            />
          ))}
        </div>
      </div>

      {surveyComplete && (
        <div className={`animate-fade-up border rounded bg-surface ${inspectionComplete ? "border-pass/40" : "border-border"}`}>
          <div className="px-3 py-2 border-b border-border2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-fire text-[12px] tracking-widest2">{extinguisher.id}</span>
              <div className="text-ink text-[11px] uppercase tracking-wide truncate">{extinguisher.label} — annual inspection</div>
              <div className="text-fainter text-[11.5px] leading-snug font-sans">{extinguisher.location}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {extinguisher.history && <DeviceHistoryPeek history={extinguisher.history} />}
              {inspectionComplete && <span className="text-pass text-[12px] tracking-widest2">✓ PASS</span>}
            </div>
          </div>
          <div className="p-2 space-y-1.5">
            <BarcodeScan deviceId={extinguisher.id} onScanned={() => setScanned(true)} />
            {scanned &&
              INSPECTION_ROWS.map((row, i) => (
                <CheckRow
                  key={row}
                  label={row}
                  checked={!!inspDone[i]}
                  onCheck={() => setInspDone((m) => ({ ...m, [i]: true }))}
                />
              ))}

            {scanned && maintRows.length > 0 && (
              <div className="pt-1 border-t border-border2 mt-1">
                <button
                  onClick={() => setShowMaint((v) => !v)}
                  className="w-full flex items-center gap-1.5 text-fainter text-[11px] tracking-widest2 uppercase px-1 py-1.5 hover:text-ink transition-colors"
                >
                  {showMaint ? "▾" : "▸"} Annual maintenance (optional)
                </button>
                {showMaint && (
                  <div className="space-y-1.5">
                    {maintRows.map((row, i) => (
                      <CheckRow
                        key={row}
                        label={row}
                        checked={!!maintDone[i]}
                        onCheck={() => setMaintDone((m) => ({ ...m, [i]: true }))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
