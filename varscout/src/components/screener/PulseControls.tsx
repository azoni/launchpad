"use client";

import { money } from "@/lib/format";
import type { PulseConfig } from "@/lib/variational/pulse";

const NOTIONALS = [1_000, 5_000, 25_000, 100_000, 250_000];
const WINDOWS = [5, 15, 30, 60];
const HOLDS = [0.5, 1, 4, 12, 24];

const holdLabel = (h: number) => (h < 1 ? `${h * 60}m` : `${h}h`);

export function PulseControls({
  cfg,
  onChange,
  windowMinutes,
  onWindowChange,
}: {
  cfg: PulseConfig;
  onChange: (next: PulseConfig) => void;
  windowMinutes: number;
  onWindowChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
      <Field label="Look back">
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <Chip key={w} active={windowMinutes === w} onClick={() => onWindowChange(w)}>
              {w}m
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Hold for">
        <div className="flex gap-1">
          {HOLDS.map((h) => (
            <Chip key={h} active={cfg.holdHours === h} onClick={() => onChange({ ...cfg, holdHours: h })}>
              {holdLabel(h)}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Position size">
        <div className="flex flex-wrap gap-1">
          {NOTIONALS.map((n) => (
            <Chip key={n} active={cfg.notional === n} onClick={() => onChange({ ...cfg, notional: n })}>
              {money(n)}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Min edge vs spread">
        <div className="flex gap-1">
          {[1, 1.5, 3].map((v) => (
            <Chip key={v} active={cfg.minViability === v} onClick={() => onChange({ ...cfg, minViability: v })}>
              {v}x
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tnum min-h-[34px] border px-2.5 py-1 text-[0.78rem] transition-colors ${
        active
          ? "border-rust bg-rust text-paper"
          : "border-rule-2 bg-paper text-ink-2 hover:border-rust hover:text-rust"
      }`}
    >
      {children}
    </button>
  );
}
