"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Device } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";

function GaugeWidget({ onLog }: { onLog: () => void }) {
  const [psi, setPsi] = useState(65);
  const [logged, setLogged] = useState(false);
  return (
    <div className="mt-1 border border-border2 rounded bg-[#0a0e14] p-3">
      <div className="flex items-baseline justify-between">
        <span className="tactical-label">// Main drain — residual</span>
        <span className="text-faint text-[9px] tracking-widest2">LAST YR: 50 PSI</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className={`text-2xl tabular-nums ${psi === 48 ? "text-pass" : "text-ink"}`}>{psi}</span>
        <span className="text-faint text-[10px]">PSI</span>
      </div>
      <input
        type="range"
        min={40}
        max={66}
        step={1}
        value={psi}
        disabled={logged}
        onChange={(e) => {
          setPsi(Number(e.target.value));
          haptic(5);
        }}
        className="w-full mt-2 accent-[#ff4500]"
        aria-label="Drag the gauge to the residual reading"
      />
      <p className="text-fainter text-[9px] tracking-widest2 uppercase mt-1">▸ Crack the drain — settle the needle at 48</p>
      <button
        disabled={psi !== 48 || logged}
        onClick={() => {
          haptic();
          setLogged(true);
          onLog();
        }}
        className={`mt-2 w-full py-2.5 rounded text-[10px] tracking-widest2 uppercase border transition-all ${
          logged
            ? "border-pass/50 text-pass"
            : psi === 48
              ? "border-fire bg-fire text-white active:scale-[0.98]"
              : "border-border2 text-fainter"
        }`}
      >
        {logged ? "✓ Logged — 48 PSI, recovery 0:40" : "Log residual"}
      </button>
    </div>
  );
}

function StopwatchWidget({ onLog }: { onLog: () => void }) {
  const [phase, setPhase] = useState<"idle" | "running" | "signal" | "logged">("idle");
  const [t, setT] = useState(0);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const start = () => {
    haptic();
    setPhase("running");
    const began = performance.now();
    const tick = () => {
      const el = Math.min(((performance.now() - began) / 1000) * 17, 34); // dramatized clock → 0:34
      setT(el);
      if (el >= 34) {
        setPhase("signal");
        haptic(30);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const mmss = `0:${String(Math.floor(t)).padStart(2, "0")}`;

  return (
    <div className="mt-1 border border-border2 rounded bg-[#0a0e14] p-3">
      <div className="flex items-baseline justify-between">
        <span className="tactical-label">// Inspector&apos;s test connection</span>
        <span className="text-faint text-[9px] tracking-widest2">NFPA 72: ≤ 90 s</span>
      </div>
      <div className={`mt-3 text-2xl tabular-nums ${phase === "signal" || phase === "logged" ? "text-pass" : "text-ink"}`}>{mmss}</div>
      {phase === "idle" && (
        <button onClick={start} className="mt-2 w-full py-2.5 rounded text-[10px] tracking-widest2 uppercase bg-fire text-white active:scale-[0.98]">
          Open ITC — start clock
        </button>
      )}
      {phase === "running" && (
        <p className="mt-2 text-warn text-[10px] tracking-widest2 uppercase animate-soft-pulse">▸ Water flowing — waiting on central station…</p>
      )}
      {phase === "signal" && (
        <div className="animate-fade-up">
          <p className="mt-2 text-pass text-[10px] tracking-widest2 uppercase">● Dispatcher: waterflow signal received — acct 4471-ME</p>
          <button
            onClick={() => {
              haptic();
              setPhase("logged");
              onLog();
            }}
            className="mt-2 w-full py-2.5 rounded text-[10px] tracking-widest2 uppercase bg-fire text-white active:scale-[0.98]"
          >
            Log signal — 0:34
          </button>
        </div>
      )}
      {phase === "logged" && <p className="mt-2 text-pass text-[10px] tracking-widest2 uppercase">✓ FLOW-SW-1 passes — retard intact</p>}
    </div>
  );
}

export function ChecklistScreen({
  devices,
  offline,
  onDeviceComplete,
  onDone,
}: {
  devices: Device[];
  offline?: boolean;
  onDeviceComplete?: () => void;
  onDone: () => void;
}) {
  const [passed, setPassed] = useState<Record<string, boolean>>({});
  const bumped = useRef<Set<string>>(new Set());
  const finished = useRef(false);

  const special = useMemo(() => {
    const m: Record<string, "gauge" | "stopwatch"> = {};
    for (const d of devices) {
      d.checklistItems?.forEach((row, i) => {
        if (row.startsWith("Main drain test")) m[`${d.id}:${i}`] = "gauge";
        if (row.startsWith("Flow inspector's test connection")) m[`${d.id}:${i}`] = "stopwatch";
      });
    }
    return m;
  }, [devices]);

  const isDeviceDone = (d: Device) => d.checklistItems?.every((_, j) => passed[`${d.id}:${j}`]) ?? true;

  useEffect(() => {
    for (const d of devices) {
      if (isDeviceDone(d) && !bumped.current.has(d.id)) {
        bumped.current.add(d.id);
        haptic(20);
        onDeviceComplete?.();
      }
    }
    if (!finished.current && devices.every(isDeviceDone)) {
      finished.current = true;
      setTimeout(onDone, 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passed]);

  const passRow = (d: Device, i: number, cascade = false) => {
    setPassed((p) => {
      const next = { ...p, [`${d.id}:${i}`]: true };
      if (cascade) d.checklistItems?.forEach((_, j) => (next[`${d.id}:${j}`] = true));
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {devices.map((d) => {
        const isDone = isDeviceDone(d);
        return (
          <div key={d.id} className={`border rounded bg-surface transition-colors ${isDone ? "border-pass/40" : "border-border"}`}>
            <div className="px-3 py-2 border-b border-border2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-fire text-[10px] tracking-widest2">{d.id}</span>
                <div className="text-ink text-[11px] uppercase tracking-wide truncate">{d.label}</div>
                <div className="text-fainter text-[9px] truncate">{d.location}</div>
              </div>
              {isDone && <span className="text-pass text-[10px] tracking-widest2 shrink-0">✓ PASS</span>}
            </div>
            <div className="p-2 space-y-1">
              {d.checklistItems?.map((row, i) => {
                const key = `${d.id}:${i}`;
                const ok = passed[key];
                const kind = special[key];
                // widgets stay mounted after logging so their success states actually paint
                if (kind === "gauge") return <GaugeWidget key={key} onLog={() => passRow(d, i)} />;
                if (kind === "stopwatch") return <StopwatchWidget key={key} onLog={() => passRow(d, i, true)} />;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (ok) return;
                      haptic(8);
                      passRow(d, i);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-sm text-[10px] leading-snug transition-colors ${
                      ok ? "text-pass" : "text-muted hover:bg-[#0a0e14] active:bg-[#0a0e14]"
                    }`}
                  >
                    {ok ? "✓" : "○"} {row}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {offline && (
        <p className="text-warn text-[9px] tracking-widest2 uppercase text-center">⚠ Offline — every capture files to the local queue</p>
      )}
    </div>
  );
}
