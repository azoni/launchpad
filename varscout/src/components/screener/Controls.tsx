"use client";

import { money } from "@/lib/format";
import type { ScoringConfig } from "@/lib/variational/types";

const NOTIONALS = [1_000, 5_000, 25_000, 100_000, 250_000, 1_000_000];
const HOLDS = [1, 3, 7, 30];

/**
 * Size is the most consequential input on the page, not a preference. The
 * spread widens ~10x with size in thin markets while the carry stays flat, so
 * the top-ranked position genuinely changes between a $5k and a $100k clip.
 */
export function Controls({
  cfg,
  onChange,
}: {
  cfg: ScoringConfig;
  onChange: (next: ScoringConfig) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
      <Field label="Position size">
        <div className="flex flex-wrap gap-1">
          {NOTIONALS.map((n) => (
            <Chip key={n} active={cfg.notional === n} onClick={() => onChange({ ...cfg, notional: n })}>
              {money(n)}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Hold">
        <div className="flex gap-1">
          {HOLDS.map((d) => (
            <Chip key={d} active={cfg.holdDays === d} onClick={() => onChange({ ...cfg, holdDays: d })}>
              {d}d
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Rank by">
        <div className="flex gap-1">
          <Chip active={!cfg.riskAdjusted} onClick={() => onChange({ ...cfg, riskAdjusted: false })}>
            Net carry
          </Chip>
          <Chip active={cfg.riskAdjusted} onClick={() => onChange({ ...cfg, riskAdjusted: true })}>
            Carry / vol
          </Chip>
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
