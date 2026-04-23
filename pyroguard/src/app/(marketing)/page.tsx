import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="relative container pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="relative max-w-3xl space-y-6">
          <div className="text-fire text-[10px] tracking-widest2">
            // SEATTLE FIRE INSPECTION PLATFORM
          </div>
          <h1 className="font-display text-5xl md:text-7xl tracking-widest3 text-white leading-[0.95]">
            FIRE/LIFE-SAFETY
            <br />
            INSPECTION,
            <br />
            <span className="text-fire">DONE RIGHT.</span>
          </h1>
          <p className="text-base md:text-lg text-muted leading-relaxed max-w-2xl">
            NFPA 72 checklists, route optimization, AI code-lookup and deficiency drafting,
            AHJ-ready PDF reports. For commercial inspection contractors who&apos;d rather fix
            things than fight paperwork.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <Link
              href="/app"
              className="bg-fire hover:bg-fire3 text-white px-6 py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-colors inline-flex items-center justify-center gap-2"
            >
              ⚡ Launch Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/standards"
              className="border border-border hover:border-fire text-ink px-6 py-3.5 rounded text-[12px] tracking-widest2 uppercase transition-colors inline-flex items-center justify-center"
            >
              NFPA Coverage
            </Link>
          </div>
          <p className="text-[10px] text-fainter tracking-widest2 pt-3">
            NO SIGNUP · BROWSER-BOUND · 6 SEATTLE SITES PRE-SEEDED
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-bg/80">
        <div className="container py-14 md:py-20">
          <div className="tactical-label mb-3">// CAPABILITIES</div>
          <h2 className="font-display text-3xl md:text-4xl tracking-widest3 text-white mb-10">
            BUILT FOR THE FIELD. RESPECTED BY THE OFFICE.
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.t}
                className="bg-surface border border-border rounded p-5 hover:border-fire transition-colors"
              >
                <div className="text-fire text-xl mb-3">{f.icon}</div>
                <div className="text-[13px] font-semibold text-ink mb-1.5">{f.t}</div>
                <div className="text-[11px] text-muted leading-relaxed">{f.b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 md:py-24">
        <div className="max-w-2xl space-y-4">
          <div className="tactical-label">// NEXT STEP</div>
          <h2 className="font-display text-3xl md:text-5xl tracking-widest3 text-white leading-tight">
            RUN A 6-SITE
            <br />
            SEATTLE INSPECTION
            <br />
            <span className="text-fire">IN TWO MINUTES.</span>
          </h2>
          <p className="text-muted text-sm md:text-base max-w-xl">
            Sandbox spins up in your browser. NFPA 72 checklists, optimized route, AI assistant, and
            a signed PDF on the way out.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 mt-4 bg-fire hover:bg-fire3 text-white px-6 py-3.5 rounded text-[12px] tracking-widest2 uppercase"
          >
            ⚡ Launch Demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

const FEATURES = [
  {
    icon: "◉",
    t: "AI Assistant (Claude)",
    b: "NFPA §-cited answers, structured deficiency drafting, report narratives. Defers citation when uncertain.",
  },
  {
    icon: "◈",
    t: "Route Optimization",
    b: "Nearest-neighbor reorder across Seattle stops with live drive-time delta. One-tap handoff to native Maps.",
  },
  {
    icon: "✓",
    t: "NFPA 72 Checklists",
    b: "System-level workflows for Smoke, Sprinkler, Suppression, Pull Stations, VESDA, Kitchen Hood, and more.",
  },
  {
    icon: "⎘",
    t: "AHJ-Ready PDFs",
    b: "NFPA 72 Chapter 14 record-of-completion, generated client-side, downloadable instantly.",
  },
  {
    icon: "⬛",
    t: "Real-Time Dashboard",
    b: "Mission-board view: today's jobs, criticals, completion %, optimized route preview.",
  },
  {
    icon: "⚡",
    t: "Zero-Signup Demo",
    b: "Click Launch, get a sandbox seeded with 6 Seattle customers. No account, no credit card.",
  },
];
