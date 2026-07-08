"use client";
import { useState } from "react";
import type { Choice } from "@/lib/demo/types";
import { haptic } from "@/lib/haptics";

export function ChoiceScreen({
  choices,
  onDone,
}: {
  choices: Choice[];
  onDone: (firstTry: boolean) => void;
}) {
  const [picked, setPicked] = useState<Choice | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);

  const pick = (c: Choice) => {
    if (locked) return;
    haptic(c.correct ? 15 : 40);
    setPicked(c);
    const n = attempts + 1;
    setAttempts(n);
    if (c.correct) {
      setLocked(true);
      onDone(n === 1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {choices.map((c) => {
          const isPicked = picked?.label === c.label;
          return (
            <button
              key={c.label}
              onClick={() => pick(c)}
              disabled={locked && !isPicked}
              className={`w-full text-left px-4 py-3.5 rounded border text-[11px] tracking-widest2 uppercase transition-all active:scale-[0.98] ${
                isPicked
                  ? c.correct
                    ? "border-pass text-pass bg-pass/5"
                    : "border-alarm text-alarm bg-alarm/5"
                  : locked
                    ? "border-border2 text-fainter"
                    : "border-border text-ink2 hover:border-fire"
              }`}
            >
              {isPicked ? (c.correct ? "✓ " : "✕ ") : "▸ "}
              {c.label}
            </button>
          );
        })}
      </div>

      {picked && (
        <div
          key={picked.label}
          className={`animate-fade-up border rounded p-3 text-[11px] leading-relaxed ${
            picked.correct ? "border-pass/50 bg-pass/5 text-ink2" : "border-alarm/50 bg-alarm/5 text-muted"
          }`}
        >
          <div className={`text-[9px] tracking-widest2 uppercase mb-1 ${picked.correct ? "text-pass" : "text-alarm"}`}>
            {picked.correct ? "// Confirmed" : "// Negative — pick again"}
          </div>
          {picked.feedback}
        </div>
      )}
    </div>
  );
}
