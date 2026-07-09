"use client";
import { useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/haptics";

export type ReportFinding = {
  deviceId: string;
  label: string;
  location: string;
  severity: string;
  standard: string;
  note: string;
};

type Meta = {
  site: string;
  address: string;
  inspector: string;
  license: string;
  ahj: string;
  portal: string;
  customer: string;
};

/**
 * The AI moment: the office step's "report auto-generated" claim, made real. Taps once,
 * POSTs the run's two structured findings to /api/report (Claude), then types the finished
 * AHJ deficiency letter onto the screen. The letter is readable — an inspector can judge
 * every citation — which is exactly what keeps it credible instead of a spinner. The route
 * has a scripted fallback AND the client has its own timeout + fallback, so the office step
 * ALWAYS completes and the demo can never dead-end here.
 */
export function LiveReport({
  findings,
  meta,
  onDone,
}: {
  findings: ReportFinding[];
  meta: Meta;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "drafting" | "typing" | "done">("idle");
  const [full, setFull] = useState("");
  const [shown, setShown] = useState(0);
  const [fanned, setFanned] = useState(0);
  const [reduced, setReduced] = useState(false);
  const finished = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch {
      /* no-op */
    }
  }, []);

  const FANOUT = [
    { k: "AHJ", body: `Filed to ${meta.ahj} via ${meta.portal} — 30-day correction clock running.` },
    { k: "QUOTE", body: "Both deficiencies priced from the pricebook — head replacement + radio battery — on a hosted approval link in Dana's inbox." },
    { k: "INVOICE", body: "Today's inspection invoiced. Same day. Truck's still on Western Ave." },
  ];

  const clientFallback = () =>
    `Deficiency notice — ${meta.site}, ${meta.address}\n\n${findings
      .map((f, i) => `${i + 1}. ${f.deviceId} — ${f.label} (${f.location}). ${f.severity.toUpperCase()} per ${f.standard}. ${f.note}`)
      .join("\n\n")}\n\nCorrective action required within 30 days of this notice. Certified by ${meta.inspector}, ${meta.license}.`;

  const start = async () => {
    haptic();
    setPhase("drafting");
    let text = "";
    // Client-side timeout so a hung request can never freeze the office step.
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meta, findings }),
        signal: ctrl.signal,
      });
      const data = await res.json();
      text = typeof data?.text === "string" ? data.text : "";
    } catch {
      text = "";
    } finally {
      clearTimeout(to);
    }
    setFull(text || clientFallback());
    setPhase("typing");
  };

  // Typewriter reveal (skipped for reduced-motion)
  useEffect(() => {
    if (phase !== "typing") return;
    if (reduced || shown >= full.length) {
      if (shown < full.length) setShown(full.length);
      setPhase("done");
      return;
    }
    const id = setTimeout(() => setShown((n) => Math.min(full.length, n + 4)), 12);
    return () => clearTimeout(id);
  }, [phase, shown, full, reduced]);

  // Follow the cursor as it types
  useEffect(() => {
    if (phase === "typing" && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [shown, phase]);

  // Fan-out after the letter, then complete
  useEffect(() => {
    if (phase !== "done") return;
    if (fanned < FANOUT.length) {
      if (reduced) {
        setFanned(FANOUT.length);
        return;
      }
      const id = setTimeout(() => {
        setFanned((n) => n + 1);
        haptic(10);
      }, 650);
      return () => clearTimeout(id);
    }
    if (!finished.current) {
      finished.current = true;
      setTimeout(onDone, reduced ? 0 : 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, fanned, reduced]);

  return (
    <div className="space-y-3">
      {phase === "idle" && (
        <button
          onClick={start}
          className="w-full bg-fire hover:bg-fire3 active:scale-[0.98] text-white py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-all animate-soft-pulse"
        >
          ✦ Draft the report + AHJ letter
        </button>
      )}

      {phase !== "idle" && (
        <div className="border border-border rounded bg-[#0a0e14] overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border2 bg-surface">
            <span className="text-fire text-[10.5px] tracking-widest2 uppercase">✦ PyroGuard AI · AHJ deficiency letter</span>
            <span className="text-fainter text-[10px] tracking-widest2 uppercase">
              {phase === "drafting" ? "drafting…" : phase === "typing" ? "writing…" : "✓ ready"}
            </span>
          </div>
          <div ref={scrollRef} className="p-3 max-h-[44vh] overflow-y-auto no-scrollbar">
            {phase === "drafting" ? (
              <p className="text-warn text-[12px] tracking-widest2 uppercase animate-soft-pulse leading-relaxed">
                ▸ Reading your {findings.length} findings · pulling NFPA 25 / 72 citations · drafting the letter…
              </p>
            ) : (
              <pre className="text-ink2 text-[11.5px] leading-relaxed font-mono whitespace-pre-wrap break-words">
                {full.slice(0, shown)}
                {phase === "typing" && <span className="text-fire animate-soft-pulse">▋</span>}
              </pre>
            )}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-1.5 animate-fade-up">
          <p className="text-pass text-[11.5px] tracking-widest2 uppercase px-1">
            ✓ Stamped {meta.inspector.split(" ")[0]} · you didn&apos;t type a word of it
          </p>
          {FANOUT.slice(0, fanned).map((b) => (
            <div key={b.k} className="border border-pass/40 bg-pass/5 rounded p-2.5 animate-fade-up">
              <span className="text-pass text-[11px] tracking-widest2 uppercase">✓ {b.k}</span>
              <p className="mt-1 text-ink2 text-[12px] leading-relaxed font-sans">{b.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
