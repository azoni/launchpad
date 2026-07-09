import Link from "next/link";

const PILLARS = [
  {
    glyph: "◈",
    title: "Schedule",
    copy: "Bulk-generate the month from NFPA frequency records. Level lumpy due-windows, assign by cert, route the day.",
  },
  {
    glyph: "✓",
    title: "Inspect",
    copy: "Offline field walk-throughs with standard-specific question sets, photo-backed findings, signatures on device.",
  },
  {
    glyph: "⎘",
    title: "File",
    copy: "Deadline-aware AHJ submission — red tags routed before the legal clock runs out, routine reports without re-keying.",
  },
  {
    glyph: "⚡",
    title: "Quote",
    copy: "Failed device to approved, priced repair the same day. Photo-backed quotes on a hosted approval link.",
  },
  {
    glyph: "◉",
    title: "Invoice",
    copy: "Cycle billing, per-inspection, and T&M from captured parts and hours — posted, sent, and paid without double entry.",
  },
];

export default function LandingPage() {
  return (
    <div className="grid-bg">
      <section className="container py-24 sm:py-32">
        <div className="tactical-label mb-6">// Fire/Life-Safety Operations Platform</div>
        <h1 className="font-display text-4xl sm:text-6xl uppercase tracking-widest2 text-ink leading-tight max-w-4xl animate-slide-in">
          Everything your inspection business runs on.
          <span className="text-fire"> One platform.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-muted text-sm leading-relaxed animate-fade-up">
          PyroGuard is being rebuilt from the ground up as the all-in-one system for fire and
          life-safety inspection contractors — scheduling, field inspections, AHJ filing,
          deficiency quoting, and invoicing, connected to the tools you already use.
        </p>
        <div className="mt-12 flex flex-wrap items-center gap-4 text-[11px] tracking-widest2 uppercase">
          <Link
            href="/demo"
            className="bg-fire hover:bg-fire3 text-white px-5 py-3 rounded transition-all active:scale-95"
          >
            ▶ Play: A Day in the Field
          </Link>
          <a
            href="mailto:charltonuw@gmail.com?subject=PyroGuard"
            className="border border-border hover:border-fire text-faint hover:text-ink px-4 py-3 rounded transition-colors"
          >
            Get in touch →
          </a>
          <span className="animate-soft-pulse text-warn basis-full sm:basis-auto">● Rebuild in progress</span>
        </div>
        <p className="mt-3 text-faint text-[10px] tracking-widest2 uppercase">
          ▸ Playable demo — one real NFPA 25 inspection, riser to invoice. ~8 min, best on your phone.
        </p>
      </section>

      <section className="container pb-24">
        <div className="tactical-label mb-6">// The Loop We Close</div>
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-5 bg-border border border-border rounded">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="bg-surface p-5 hover:border-fire border border-transparent transition-colors"
            >
              <div className="text-fire text-lg">{p.glyph}</div>
              <div className="mt-3 text-ink text-[12px] uppercase tracking-widest2">{p.title}</div>
              <p className="mt-2 text-faint text-[11px] leading-relaxed">{p.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <div className="tactical-label mb-2">// The Landscape</div>
        <p className="text-faint text-[11px] leading-relaxed max-w-2xl mb-6">
          Today a contractor stitches together three to five of these — plus SedonaOffice or QuickBooks for the money —
          and re-keys the same finding between all of them. Know the field:
        </p>
        <div className="grid gap-px sm:grid-cols-3 bg-border border border-border rounded max-w-3xl">
          {[
            {
              name: "Inspect Point",
              url: "https://www.inspectpoint.com",
              note: "Fire-specific inspections + proposals. iOS-only field app. Acquired FormLink (AHJ filing) and FireCAD.",
            },
            {
              name: "ServiceTrade",
              url: "https://servicetrade.com",
              note: "Commercial field service with the signature deficiency-to-quote pipeline. Accounting punts to QuickBooks/Intacct.",
            },
            {
              name: "Uptick",
              url: "https://www.uptickhq.com",
              note: "Fire/life-safety maintenance platform. Free subcontractor seats, transparent pricing attack on quote-only incumbents.",
            },
          ].map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface p-5 border border-transparent hover:border-fire transition-colors group"
            >
              <div className="text-ink text-[12px] uppercase tracking-widest2 group-hover:text-fire transition-colors">
                {c.name} ↗
              </div>
              <p className="mt-2 text-faint text-[10px] leading-relaxed">{c.note}</p>
            </a>
          ))}
        </div>
        <p className="mt-4 text-fainter text-[10px] leading-relaxed max-w-2xl">
          None of them combine fire-native inspections, RMR/agreement billing, accounting, and AHJ filing in one
          system. That gap is PyroGuard.
        </p>
      </section>
    </div>
  );
}
