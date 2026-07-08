"use client";
import Link from "next/link";
import type { Tally } from "@/lib/demo/types";
import type { FieldNote } from "@/lib/demo/useFieldNotes";
import type { DemoDeficiency } from "@/lib/demo/useDeficiencies";

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
        className="border border-fire rounded bg-fire/5 p-4 animate-fade-up opacity-0 [animation-fill-mode:forwards]"
        style={{ animationDelay: `${tallies.length * 180 + 200}ms` }}
      >
        <p className="text-ink text-[13.5px] leading-relaxed font-sans">{closing}</p>
        <div className="mt-4 space-y-2">
          <a
            href="mailto:hello@pyroguard.app?subject=PyroGuard%20demo"
            className="block text-center bg-fire hover:bg-fire3 active:scale-[0.98] text-white py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all"
          >
            Run your whole shop like this →
          </a>
          <div className="flex gap-2">
            <button
              onClick={onReplay}
              className="flex-1 border border-border hover:border-fire text-faint hover:text-ink py-2.5 rounded text-[12px] tracking-widest2 uppercase transition-colors"
            >
              ↻ Replay
            </button>
            <Link
              href="/"
              className="flex-1 text-center border border-border hover:border-fire text-faint hover:text-ink py-2.5 rounded text-[12px] tracking-widest2 uppercase transition-colors"
            >
              ← Back to base
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
