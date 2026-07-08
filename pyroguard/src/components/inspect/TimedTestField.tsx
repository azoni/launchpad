"use client";
import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * Timed-test field for the inspect flow (flow-switch signal time, forward-flow, etc.).
 * Per inspector feedback the DEFAULT is a plain number box — just type the seconds. The
 * running stopwatch is an OPTIONAL toggle, not a gate you have to sit through.
 */
export function TimedTestField({
  label,
  value,
  done,
  onLog,
  nfpaLimit,
}: {
  label?: string;
  value?: number;
  done: boolean;
  onLog: (sec: number) => void;
  nfpaLimit?: number;
}) {
  const [sec, setSec] = useState<number>(value ?? NaN);
  const [useTimer, setUseTimer] = useState(false);
  const [running, setRunning] = useState(false);
  const raf = useRef(0);
  const started = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  // The persisted reading loads asynchronously after mount; adopt it when it arrives.
  useEffect(() => {
    if (value != null && !running) setSec(value);
  }, [value, running]);

  const start = () => {
    haptic();
    setRunning(true);
    started.current = performance.now();
    const tick = () => {
      setSec((performance.now() - started.current) / 1000);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const stop = () => {
    cancelAnimationFrame(raf.current);
    setRunning(false);
    setSec((s) => Math.round(s));
    haptic(20);
  };

  const valid = Number.isFinite(sec);
  const within = nfpaLimit == null || (valid && sec <= nfpaLimit);
  const mmss = valid ? `0:${String(Math.floor(sec)).padStart(2, "0")}` : "0:00";

  return (
    <div className="mt-2 border border-border rounded-md bg-bg/50 p-3">
      <div className="flex items-center justify-between gap-2">
        {label && <div className="tactical-label">{label}</div>}
        <button
          type="button"
          onClick={() => setUseTimer((t) => !t)}
          className="text-[11px] text-faint hover:text-ink underline underline-offset-2 shrink-0"
        >
          {useTimer ? "Enter manually" : "Use timer"}
        </button>
      </div>
      {nfpaLimit != null && <div className="text-[11px] text-faint mt-1">NFPA 72: ≤ {nfpaLimit}s</div>}

      {!useTimer ? (
        <div className="flex items-center gap-3 mt-2">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={valid ? sec : ""}
            onChange={(e) => setSec(e.target.value === "" ? NaN : Number(e.target.value))}
            placeholder="0"
            className="w-24 bg-surface border border-border rounded-md px-2.5 py-1.5 text-[15px] text-ink tabular-nums focus:border-fire/50 focus:outline-none"
            aria-label={label ? `${label} seconds` : "seconds"}
          />
          <span className="text-[13px] text-muted">seconds</span>
        </div>
      ) : (
        <div className="mt-2">
          <div className={`text-2xl tabular-nums ${within ? "text-ink" : "text-fire3"}`}>{mmss}</div>
          {!running ? (
            <button
              type="button"
              onClick={start}
              className="mt-2 w-full py-2 rounded-md text-[12px] tracking-wide uppercase bg-fire text-white hover:bg-fire3 transition-colors"
            >
              Start clock
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="mt-2 w-full py-2 rounded-md text-[12px] tracking-wide uppercase border border-fire text-fire3 transition-colors"
            >
              Stop
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={!valid}
        onClick={() => {
          haptic();
          onLog(Math.round(sec));
        }}
        className={`mt-3 w-full py-2 rounded-md text-[12px] tracking-wide uppercase border transition-colors ${
          done
            ? "border-pass/50 text-pass"
            : "border-fire bg-fire text-white hover:bg-fire3 disabled:opacity-40"
        }`}
      >
        {done
          ? `Logged — ${valid ? Math.round(sec) : 0}s${nfpaLimit != null ? (within ? " · pass" : " · over limit") : ""}`
          : "Log time"}
      </button>
    </div>
  );
}
