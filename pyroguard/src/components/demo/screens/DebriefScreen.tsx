"use client";
import Link from "next/link";
import type { Tally } from "@/lib/demo/types";
import type { FieldNote } from "@/lib/demo/useFieldNotes";
import type { DemoDeficiency } from "@/lib/demo/useDeficiencies";
import { DebriefFeedback } from "@/components/demo/screens/DebriefFeedback";

export function DebriefScreen({
  tallies,
  closing,
  outcomes,
  notes = [],
  deficiencies = [],
  onReplay,
}: {
  tallies: Tally[];
  closing: string;
  outcomes: { ontestFirstTry: boolean; severityFirstTry: boolean };
  notes?: FieldNote[];
  deficiencies?: DemoDeficiency[];
  onReplay: () => void;
}) {
  const decorate = (t: Tally): Tally => {
    if (t.label === "False-dispatch fine") {
      return { ...t, value: `${t.value} ${outcomes.ontestFirstTry ? "(first try)" : "(avoided on the recall)"}` };
    }
    if (t.label === "Severity call") {
      return { ...t, value: `${t.value} ${outcomes.severityFirstTry ? "(first try)" : "(with coaching)"}` };
    }
    return t;
  };

  // A compact summary of THIS playthrough, attached to their feedback so the owner
  // knows the context each reviewer is reacting to.
  const runContext = [
    `on-test ${outcomes.ontestFirstTry ? "first try" : "recalled"}`,
    `severity ${outcomes.severityFirstTry ? "first try" : "coached"}`,
    `${deficiencies.length} deficiency logged`,
    `${notes.length} notes`,
  ].join(" · ");

  return (
    <div className="space-y-3">
      {deficiencies.length > 0 && (
        <div className="border border-fire/40 rounded bg-fire/5 p-3">
          <div className="tactical-label">// Deficiencies logged ({deficiencies.length})</div>
          {deficiencies.map((d) => (
            <div key={d.id} className="mt-2 text-[12.5px] leading-snug">
              <span className="text-fire tracking-widest2">{d.deviceId}</span>
              <span className="text-ink2">
                {" "}
                — {d.severity ? d.severity.toUpperCase() : "unclassified"} · {d.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {notes.length > 0 && (
        <div className="border border-border rounded bg-surface p-3">
          <div className="tactical-label">// Field notes ({notes.length}) — still here, nothing lost</div>
          <div className="mt-2 space-y-1.5">
            {notes.map((n) => (
              <div key={n.id} className="text-ink2 text-[12.5px] leading-relaxed font-sans">
                <span className="text-fainter">▪</span> {n.text}
                {n.tag ? <span className="text-fire font-mono"> · {n.tag}</span> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tallies.map(decorate).map((t, i) => (
          <div
            key={t.label}
            className="border border-border rounded bg-surface p-3 animate-fade-up opacity-0 [animation-fill-mode:forwards]"
            style={{ animationDelay: `${i * 180}ms` }}
          >
            <div className="tactical-label">// {t.label}</div>
            <div className="mt-1 text-fire text-[12px] uppercase tracking-wide leading-snug">{t.value}</div>
            <p className="mt-1.5 text-faint text-[12.5px] leading-relaxed font-sans">{t.contrast}</p>
          </div>
        ))}
      </div>

      <div
        className="border border-border rounded bg-surface p-4 animate-fade-up opacity-0 [animation-fill-mode:forwards]"
        style={{ animationDelay: `${tallies.length * 180 + 200}ms` }}
      >
        <p className="text-ink text-[13.5px] leading-relaxed font-sans">{closing}</p>
      </div>

      {/* The real ending: the ask. This is the primary action now, not a sales CTA. */}
      <div
        className="animate-fade-up opacity-0 [animation-fill-mode:forwards]"
        style={{ animationDelay: `${tallies.length * 180 + 360}ms` }}
      >
        <DebriefFeedback runContext={runContext} />
      </div>

      {/* Quiet secondary links — deliberately demoted so they don't compete with the ask. */}
      <div className="flex items-center justify-center gap-5 pt-1 pb-2">
        <button
          onClick={onReplay}
          className="text-fainter hover:text-ink text-[11px] tracking-widest2 uppercase transition-colors"
        >
          ↻ Replay
        </button>
        <Link
          href="/"
          className="text-fainter hover:text-ink text-[11px] tracking-widest2 uppercase transition-colors"
        >
          ← Back to base
        </Link>
      </div>
    </div>
  );
}
