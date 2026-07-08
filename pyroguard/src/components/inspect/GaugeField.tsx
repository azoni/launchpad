"use client";
import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";

/**
 * Pressure-gauge reading for the inspect flow. Ported from the demo's slider-only gauge, but
 * adds a numeric input for precision (the slider is a coarse assist, the number box is exact).
 */
export function GaugeField({
  label,
  unit = "PSI",
  min = 0,
  max = 300,
  value,
  done,
  onLog,
}: {
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  value?: number;
  done: boolean;
  onLog: (v: number) => void;
}) {
  const [v, setV] = useState<number>(value ?? Math.round((min + max) / 2));
  // The persisted reading loads asynchronously after mount; adopt it when it arrives.
  useEffect(() => {
    if (value != null) setV(value);
  }, [value]);
  const valid = Number.isFinite(v);

  return (
    <div className="mt-2 border border-border rounded-md bg-bg/50 p-3">
      {label && <div className="tactical-label mb-2">{label}</div>}
      <div className="flex items-center gap-3">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={valid ? v : ""}
          onChange={(e) => setV(e.target.value === "" ? NaN : Number(e.target.value))}
          className="w-24 bg-surface border border-border rounded-md px-2.5 py-1.5 text-[15px] text-ink tabular-nums focus:border-fire/50 focus:outline-none"
          aria-label={label ? `${label} reading` : "gauge reading"}
        />
        <span className="text-[13px] text-muted">{unit}</span>
        {done && <span className="text-pass text-[12px] ml-auto">✓ Logged</span>}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={valid ? v : min}
        onChange={(e) => {
          setV(Number(e.target.value));
          haptic(4);
        }}
        className="w-full mt-3 accent-fire"
        aria-label={label ? `${label} slider` : "gauge slider"}
      />
      <button
        type="button"
        disabled={!valid}
        onClick={() => {
          haptic();
          onLog(v);
        }}
        className={`mt-3 w-full py-2 rounded-md text-[12px] tracking-wide uppercase border transition-colors ${
          done
            ? "border-pass/50 text-pass"
            : "border-fire bg-fire text-white hover:bg-fire3 disabled:opacity-40"
        }`}
      >
        {done ? `Update reading — ${valid ? v : "?"} ${unit}` : "Log reading"}
      </button>
    </div>
  );
}
