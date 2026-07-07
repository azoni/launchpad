import Link from "next/link";
import { ArrowRight, AlertTriangle, ClipboardCheck, Mail, BarChart3, FileText, Workflow } from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="relative">
        <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fire/30 to-transparent pointer-events-none" />
        <div className="container relative pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface/60 backdrop-blur-sm mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-fire animate-soft-pulse" />
              <span className="text-[11px] tracking-widest2 uppercase text-muted">For Fire Protection Contractors</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl text-ink leading-[1.02] tracking-tight font-semibold">
              The follow-up layer<br />
              <span className="italic font-normal text-muted">for </span>
              <span className="text-fire">fire protection.</span>
            </h1>
            <p className="mt-7 text-base md:text-lg text-ink2 leading-relaxed max-w-2xl">
              Deficiencies, quotes, repairs, and customer follow-ups stop falling through the cracks.
              A workflow layer that sits on top of your existing systems &mdash; no rip-and-replace.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-8">
              <Link
                href="/app"
                className="bg-fire hover:bg-fire2 text-white px-7 py-3.5 rounded-md text-sm font-medium tracking-wide inline-flex items-center justify-center gap-2 transition-all shadow-glow"
              >
                Open Demo Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/discovery"
                className="border border-border hover:border-muted bg-surface/60 hover:bg-surface text-ink px-7 py-3.5 rounded-md text-sm font-medium inline-flex items-center justify-center gap-2 transition-all"
              >
                Discovery Checklist
              </Link>
            </div>
            <p className="text-[11px] text-faint tracking-wide pt-6 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-faint" />
              Demo data only &middot; no signup &middot; runs in your browser
            </p>
          </div>
        </div>
      </section>

      {/* Integrations strip */}
      <section className="border-t border-border bg-bg">
        <div className="container py-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="text-[12px] text-muted max-w-md leading-relaxed">
              Reads from the systems your team already uses &mdash; <span className="text-ink">no migration, no double entry.</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              {INTEGRATIONS.map((i) => (
                <div key={i.name} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center text-[11px] font-display font-semibold text-fire">
                    {i.glyph}
                  </span>
                  <div>
                    <div className="text-[12.5px] text-ink font-medium leading-tight">{i.name}</div>
                    <div className="text-[10.5px] text-faint leading-tight">{i.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="border-y border-border bg-surface/30">
        <div className="container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-lg overflow-hidden">
            {[
              { v: "14", l: "Open deficiencies" },
              { v: "8", l: "Overdue inspections" },
              { v: "$18,450", l: "Est. follow-up revenue" },
              { v: "11", l: "Customer follow-ups today" },
            ].map((k) => (
              <div key={k.l} className="bg-surface px-5 py-6">
                <div className="font-display text-3xl md:text-4xl text-ink font-semibold tracking-tight">
                  {k.v}
                </div>
                <div className="text-[11px] text-muted tracking-wide mt-1">{k.l}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-faint mt-3 text-center">
            Sample of the operations dashboard &mdash; demo data
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section className="container py-20 md:py-28">
        <div className="max-w-2xl mb-14">
          <div className="eyebrow mb-3">What it covers</div>
          <h2 className="font-display text-3xl md:text-5xl text-ink leading-tight tracking-tight font-semibold">
            Five pieces that keep the back office moving.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.t}
              className="group bg-surface border border-border rounded-lg p-6 hover:border-fire/40 hover:bg-elevated transition-all"
            >
              <div className="w-10 h-10 rounded-md bg-fire/10 border border-fire/20 flex items-center justify-center mb-5 group-hover:bg-fire/15 transition-colors">
                <f.icon className="h-4.5 w-4.5 text-fire" />
              </div>
              <div className="text-[15px] font-medium text-ink mb-2">{f.t}</div>
              <div className="text-[13px] text-muted leading-relaxed">{f.b}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Approach */}
      <section className="border-t border-border bg-surface/30">
        <div className="container py-20 md:py-28">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
            <div>
              <div className="eyebrow mb-3">Pilot approach</div>
              <h2 className="font-display text-3xl md:text-5xl text-ink leading-tight tracking-tight font-semibold">
                A safe first step,<br />
                <span className="italic text-muted">not a system replacement.</span>
              </h2>
              <p className="mt-6 text-ink2 leading-relaxed max-w-lg">
                Most software pitches ask you to migrate everything. This is the opposite:
                a thin workflow layer that reads what you already have and surfaces what is
                falling through the cracks. The pilot is two weeks, fixed scope, no commitment.
              </p>
            </div>
            <ol className="space-y-1">
              {STEPS.map((s, i) => (
                <li key={s.t} className="bg-surface border border-border rounded-lg p-5 flex gap-4">
                  <div className="font-display text-2xl text-fire/70 font-semibold tabular-nums w-8 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-[14px] font-medium text-ink mb-1">{s.t}</div>
                    <div className="text-[13px] text-muted leading-relaxed">{s.b}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20 md:py-28">
        <div className="bg-surface border border-border rounded-lg p-10 md:p-14 relative overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
          <div className="relative max-w-2xl">
            <div className="eyebrow mb-3">Next step</div>
            <h2 className="font-display text-3xl md:text-5xl text-ink leading-tight tracking-tight font-semibold">
              See the workflow in two minutes.
            </h2>
            <p className="mt-5 text-ink2 max-w-xl leading-relaxed">
              The demo opens in your browser with seeded customers, deficiencies, and follow-up
              drafts. Walk through it together and we will tailor the pilot to your actual flow.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                href="/app"
                className="bg-fire hover:bg-fire2 text-white px-7 py-3.5 rounded-md text-sm font-medium tracking-wide inline-flex items-center justify-center gap-2 transition-all shadow-glow"
              >
                Open Demo Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/discovery"
                className="border border-border hover:border-muted text-ink px-7 py-3.5 rounded-md text-sm font-medium inline-flex items-center justify-center transition-all"
              >
                Run Discovery Checklist
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const FEATURES = [
  {
    icon: AlertTriangle,
    t: "Deficiency tracking",
    b: "Every open finding from inspection to repair, with status, severity, and assigned owner. Nothing waits in someone's inbox.",
  },
  {
    icon: Mail,
    t: "Customer follow-ups",
    b: "AI-drafted emails for quote requests and reminders. Human approves before send &mdash; the system never speaks for you.",
  },
  {
    icon: ClipboardCheck,
    t: "Inspection workflow",
    b: "Mobile pass/fail with photo evidence on fail. NFPA 72 Chapter 14 record-of-completion PDF generated on signature.",
  },
  {
    icon: BarChart3,
    t: "Operations dashboard",
    b: "Open quotes, overdue inspections, follow-ups due today, estimated follow-up revenue. The week at a glance.",
  },
  {
    icon: FileText,
    t: "Quote &amp; report drafts",
    b: "Convert a deficiency into a quote summary in one click. AHJ-ready PDF reports for compliance.",
  },
  {
    icon: Workflow,
    t: "Sits on top, not under",
    b: "No rip-and-replace. The layer reads what you already have and surfaces what needs attention this week.",
  },
];

const INTEGRATIONS = [
  { name: "ServiceTrade", role: "System of record", glyph: "ST" },
  { name: "BuildingReports", role: "Inspection reports", glyph: "BR" },
  { name: "Field forms", role: "Tech intake", glyph: "FF" },
];

const STEPS = [
  {
    t: "Discovery call",
    b: "30 minutes. Walk the demo together, identify which workflow is the most painful, agree on a single pilot scope.",
  },
  {
    t: "Two-week pilot",
    b: "We seed the workflow with one customer set or job pipeline. You use it on real follow-ups, no production risk.",
  },
  {
    t: "Decide together",
    b: "If it earns its keep we scope a fuller engagement. If not, the pilot ends &mdash; no obligation, no leftover system to uninstall.",
  },
];
