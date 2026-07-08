"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Device } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";
import { DeviceHistoryPeek } from "@/components/demo/DeviceHistoryPeek";
import { CheckRow } from "@/components/demo/CheckRow";

function GaugeWidget({ onLog }: { onLog: () => void }) {
  const [psi, setPsi] = useState<number>(65);
  const [logged, setLogged] = useState(false);
  const valid = Number.isFinite(psi);
  const atTarget = valid && Math.abs(psi - 48) <= 1; // small tolerance — no pixel-hunting

  return (
    <div className="mt-1 border border-border2 rounded bg-[#0a0e14] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="tactical-label min-w-0 truncate">// Main drain — residual</span>
        <span className="text-faint text-[11px] tracking-widest2 shrink-0 whitespace-nowrap">LAST YR: 50 PSI</span>
      </div>

      {/* Number entry is the primary control — big, labeled, obviously typeable */}
      <label className="mt-3 block text-fainter text-[10px] tracking-widest2 uppercase">Residual (off the supply gauge) — tap to type</label>
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={300}
          value={valid ? psi : ""}
          disabled={logged}
          onChange={(e) => setPsi(e.target.value === "" ? NaN : Number(e.target.value))}
          placeholder="––"
          className={`w-[86px] bg-surface border-2 rounded px-2 py-1.5 text-2xl tabular-nums text-center outline-none disabled:opacity-70 ${
            logged || atTarget ? "border-pass text-pass" : "border-fire/60 focus:border-fire text-ink"
          }`}
          aria-label="Type the residual pressure in PSI"
        />
        <span className="text-faint text-[13px]">PSI</span>
        {logged && <span className="text-pass text-[12px] ml-auto">✓ Logged</span>}
      </div>

      {/* Slider is a coarse assist over a realistic range */}
      <input
        type="range"
        min={0}
        max={200}
        step={1}
        value={valid ? psi : 0}
        disabled={logged}
        onChange={(e) => {
          setPsi(Number(e.target.value));
          haptic(5);
        }}
        className="w-full mt-3 accent-[#ff4500]"
        aria-label="Drag to the residual reading"
      />
      <div className="flex justify-between text-fainter text-[10px] tracking-widest2 mt-0.5">
        <span>0</span>
        <span>200 PSI</span>
      </div>

      <p className={`text-[11px] tracking-widest2 uppercase mt-2 leading-snug ${atTarget ? "text-pass" : "text-faint"}`}>
        {!valid
          ? "▸ Type the residual, or drag the slider to it"
          : atTarget
            ? "✓ 48 PSI — within 10% of last year's 50, supply's healthy"
            : "▸ Full flow settles the residual near 48 PSI — set it there to log (a reading under ~45 is a >10% drop → investigate)"}
      </p>
      <button
        disabled={!atTarget || logged}
        onClick={() => {
          haptic();
          setLogged(true);
          onLog();
        }}
        className={`mt-2 w-full py-2.5 rounded text-[12px] tracking-widest2 uppercase border transition-all ${
          logged
            ? "border-pass/50 text-pass"
            : atTarget
              ? "border-fire bg-fire text-white active:scale-[0.98]"
              : "border-border2 text-fainter"
        }`}
      >
        {logged ? `✓ Logged — ${valid ? psi : 48} PSI, recovery 0:40` : "Log residual"}
      </button>
    </div>
  );
}

function StopwatchWidget({ onLog }: { onLog: () => void }) {
  // Default: just type the seconds. The running stopwatch is an optional aid.
  const [useTimer, setUseTimer] = useState(false);
  const [secs, setSecs] = useState<string>("");
  const [logged, setLogged] = useState(false);
  const [phase, setPhase] = useState<"idle" | "running" | "signal">("idle");
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
        setSecs("34");
        haptic(30);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const n = Number(secs);
  const valid = secs !== "" && n > 0;
  const stamp = valid ? `0:${String(Math.floor(n)).padStart(2, "0")}` : "";
  const mmss = `0:${String(Math.floor(t)).padStart(2, "0")}`;

  if (logged) {
    return (
      <div className="mt-1 border border-pass/40 rounded bg-[#0a0e14] p-3">
        <span className="tactical-label">// Inspector&apos;s test connection</span>
        <p className="mt-2 text-pass text-[12px] tracking-widest2 uppercase">✓ FLOW-SW-1 passes — {stamp} signal, retard intact</p>
      </div>
    );
  }

  return (
    <div className="mt-1 border border-border2 rounded bg-[#0a0e14] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="tactical-label min-w-0 truncate">// Inspector&apos;s test</span>
        <span className="text-faint text-[11px] tracking-widest2 shrink-0 whitespace-nowrap">NFPA 72: ≤ 90 s</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-fainter text-[11px] tracking-widest2 uppercase">Waterflow signal at</span>
        <button
          onClick={() => setUseTimer((v) => !v)}
          className="text-fire text-[11px] tracking-widest2 uppercase underline underline-offset-2 shrink-0"
        >
          {useTimer ? "Enter manually" : "Use timer"}
        </button>
      </div>

      {!useTimer ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={secs}
            onChange={(e) => setSecs(e.target.value)}
            placeholder="34"
            className="w-[72px] bg-surface border border-border rounded px-2 py-1.5 text-xl tabular-nums text-center text-ink outline-none focus:border-fire"
            aria-label="Seconds to waterflow signal"
          />
          <span className="text-faint text-[13px]">seconds</span>
        </div>
      ) : (
        <div className="mt-2">
          <div className={`text-2xl tabular-nums ${phase === "signal" ? "text-pass" : "text-ink"}`}>{mmss}</div>
          {phase === "idle" && (
            <button onClick={start} className="mt-2 w-full py-2.5 rounded text-[12px] tracking-widest2 uppercase bg-fire text-white active:scale-[0.98]">
              Open ITC — start clock
            </button>
          )}
          {phase === "running" && (
            <p className="mt-2 text-warn text-[12px] tracking-widest2 uppercase animate-soft-pulse">▸ Water flowing — waiting on central station…</p>
          )}
          {phase === "signal" && (
            <p className="mt-2 text-pass text-[12px] tracking-widest2 uppercase animate-fade-up">● Dispatcher: signal received — acct 4471-ME</p>
          )}
        </div>
      )}

      <button
        disabled={!valid}
        onClick={() => {
          haptic();
          setLogged(true);
          onLog();
        }}
        className={`mt-3 w-full py-2.5 rounded text-[12px] tracking-widest2 uppercase border transition-all ${
          valid ? "border-fire bg-fire text-white active:scale-[0.98]" : "border-border2 text-fainter"
        }`}
      >
        {valid ? `Log signal — ${stamp}` : "Log signal"}
      </button>
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
            <div className="px-3 py-2 border-b border-border2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-fire text-[12px] tracking-widest2">{d.id}</span>
                <div className="text-ink text-[11px] uppercase tracking-wide truncate">{d.label}</div>
                <div className="text-fainter text-[11.5px] leading-snug font-sans">{d.location}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {d.history && <DeviceHistoryPeek history={d.history} />}
                {isDone && <span className="text-pass text-[12px] tracking-widest2">✓ PASS</span>}
              </div>
            </div>
            <div className="p-2 space-y-1">
              {d.checklistItems?.map((row, i) => {
                const key = `${d.id}:${i}`;
                const ok = passed[key];
                const kind = special[key];
                // widgets stay mounted after logging so their success states actually paint
                if (kind === "gauge") return <GaugeWidget key={key} onLog={() => passRow(d, i)} />;
                if (kind === "stopwatch") return <StopwatchWidget key={key} onLog={() => passRow(d, i, true)} />;
                return <CheckRow key={key} label={row} checked={!!ok} onCheck={() => passRow(d, i)} />;
              })}
            </div>
          </div>
        );
      })}
      {offline && (
        <p className="text-warn text-[11px] tracking-widest2 uppercase text-center">⚠ Offline — every capture files to the local queue</p>
      )}
    </div>
  );
}
