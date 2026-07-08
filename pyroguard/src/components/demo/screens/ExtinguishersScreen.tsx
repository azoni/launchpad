"use client";
import { useEffect, useRef, useState } from "react";
import type { Device } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";

function SwipeRow({ label, onPass }: { label: string; onPass: () => void }) {
  const [dx, setDx] = useState(0);
  const [passed, setPassed] = useState(false);
  const startX = useRef<number | null>(null);

  return (
    <div
      className="relative overflow-hidden rounded-sm"
      onPointerDown={(e) => {
        if (passed) return;
        startX.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (passed || startX.current === null) return;
        setDx(Math.max(0, Math.min(e.clientX - startX.current, 120)));
      }}
      onPointerUp={() => {
        if (passed) return;
        if (dx > 64) {
          setPassed(true);
          haptic();
          onPass();
        }
        setDx(0);
        startX.current = null;
      }}
      onPointerCancel={() => {
        setDx(0);
        startX.current = null;
      }}
      style={{ touchAction: "pan-y" }}
    >
      <div className="absolute inset-0 flex items-center pl-3 bg-pass/10 text-pass text-[10px] tracking-widest2 uppercase">
        ✓ Pass
      </div>
      <div
        className={`relative px-3 py-2.5 text-[10px] leading-snug border border-border2 rounded-sm bg-surface transition-transform ${
          passed ? "text-pass border-pass/40" : "text-muted"
        }`}
        style={{ transform: passed ? undefined : `translateX(${dx}px)`, transition: dx === 0 ? "transform 150ms ease" : "none" }}
      >
        {passed ? "✓" : "⇥"} {label}
      </div>
    </div>
  );
}

function BarcodeScan({ deviceId, onScanned }: { deviceId: string; onScanned: () => void }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  return (
    <button
      disabled={phase !== "idle"}
      onClick={() => {
        haptic();
        setPhase("scanning");
        setTimeout(() => {
          setPhase("done");
          haptic(25);
          onScanned();
        }, 1100);
      }}
      className={`relative w-full overflow-hidden border rounded p-3 text-left transition-colors ${
        phase === "done" ? "border-pass/50" : "border-border hover:border-fire"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex gap-[2px]" aria-hidden>
          {[3, 1, 2, 1, 3, 2, 1, 3, 1, 2].map((w, i) => (
            <span key={i} className={`h-8 ${phase === "done" ? "bg-pass" : "bg-ink"}`} style={{ width: w }} />
          ))}
        </span>
        <span className={`text-[10px] tracking-widest2 uppercase ${phase === "done" ? "text-pass" : "text-ink2"}`}>
          {phase === "idle" && `Scan barcode — ${deviceId}`}
          {phase === "scanning" && "Scanning…"}
          {phase === "done" && `✓ ${deviceId} verified on route`}
        </span>
      </div>
      {phase === "scanning" && (
        <span className="absolute inset-y-0 left-0 w-0.5 bg-fire shadow-[0_0_12px_2px_rgba(255,69,0,0.8)] animate-[scanline_1.1s_linear]" />
      )}
    </button>
  );
}

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
  const maintRows = extinguisher.checklistItems ?? [];
  const [surveyDone, setSurveyDone] = useState(0);
  const [scanned, setScanned] = useState(false);
  const [maintDone, setMaintDone] = useState<Record<number, boolean>>({});
  const finished = useRef(false);

  const surveyComplete = surveyDone >= surveyRows.length;
  const maintComplete = scanned && maintRows.every((_, i) => maintDone[i]);

  useEffect(() => {
    if (surveyComplete && maintComplete && !finished.current) {
      finished.current = true;
      setTimeout(onDone, 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyComplete, maintComplete]);

  return (
    <div className="space-y-3">
      <div className={`border rounded bg-surface ${surveyComplete ? "border-pass/40" : "border-border"}`}>
        <div className="px-3 py-2 border-b border-border2 flex items-center justify-between">
          <div>
            <span className="text-fire text-[10px] tracking-widest2">{survey.id}</span>
            <div className="text-ink text-[11px] uppercase tracking-wide">{survey.label}</div>
          </div>
          {surveyComplete && <span className="text-pass text-[10px] tracking-widest2">✓ PASS</span>}
        </div>
        <div className="p-2 space-y-1.5">
          {!surveyComplete && <p className="text-fainter text-[9px] tracking-widest2 uppercase px-1">▸ Swipe right to pass each check</p>}
          {surveyRows.map((row) => (
            <SwipeRow key={row} label={row} onPass={() => setSurveyDone((n) => n + 1)} />
          ))}
        </div>
      </div>

      {surveyComplete && (
        <div className={`animate-fade-up border rounded bg-surface ${maintComplete ? "border-pass/40" : "border-border"}`}>
          <div className="px-3 py-2 border-b border-border2">
            <span className="text-fire text-[10px] tracking-widest2">{extinguisher.id}</span>
            <div className="text-ink text-[11px] uppercase tracking-wide">{extinguisher.label} — annual maintenance</div>
            <div className="text-fainter text-[9px]">{extinguisher.location}</div>
          </div>
          <div className="p-2 space-y-1.5">
            <BarcodeScan deviceId={extinguisher.id} onScanned={() => setScanned(true)} />
            {scanned &&
              maintRows.map((row, i) => (
                <button
                  key={row}
                  onClick={() => {
                    if (maintDone[i]) return;
                    haptic(8);
                    setMaintDone((m) => ({ ...m, [i]: true }));
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-sm text-[10px] leading-snug transition-colors ${
                    maintDone[i] ? "text-pass" : "text-muted hover:bg-[#0a0e14] active:bg-[#0a0e14]"
                  }`}
                >
                  {maintDone[i] ? "✓" : "○"} {row}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
