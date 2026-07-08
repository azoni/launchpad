"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Clock, FileCheck, DollarSign, Mail, ArrowUpRight, CheckCircle2,
} from "lucide-react";
import {
  DEFICIENCIES, FOLLOW_UP_DRAFTS, DASHBOARD_KPIS, SEVERITY_TONE,
} from "@/lib/deficiencies";
import { applyView, DEFAULT_VIEW } from "@/lib/deficiencies-view";
import { useDeficiencyPrefs } from "@/lib/store/prefs";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { StatusPill } from "@/components/ui/status-pill";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Honor the inspector's saved deficiency view so the card matches the Deficiencies page.
  // Gate on mount to avoid an SSR/localStorage hydration mismatch in the rendered rows.
  const storedView = useDeficiencyPrefs((s) => s.deficiencyView);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const view = hydrated ? storedView : DEFAULT_VIEW;
  const openDeficiencies = useMemo(() => applyView(DEFICIENCIES, view).slice(0, 6), [view]);

  const drafts = FOLLOW_UP_DRAFTS.filter((f) => f.status === "draft").slice(0, 4);

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto animate-slide-in">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
        <div>
          <div className="eyebrow mb-2" suppressHydrationWarning>{today}</div>
          <h1 className="font-display text-3xl sm:text-4xl text-ink font-semibold tracking-tight">
            Operations dashboard
          </h1>
          <p className="text-[13.5px] text-muted mt-1.5">
            Where deficiencies, follow-ups, and inspections actually stand this week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-border text-[11px] tracking-wide text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-pass animate-soft-pulse" />
            Synced: ServiceTrade &middot; BuildingReports &middot; Forms
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-warn/10 border border-warn/20 text-[11px] tracking-wide text-warn">
            <span className="w-1.5 h-1.5 rounded-full bg-warn animate-soft-pulse" />
            Demo data
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
        <Kpi icon={AlertTriangle} label="Open deficiencies" value={DASHBOARD_KPIS.openDeficiencies} accent="#f87171" href="/app/deficiencies" />
        <Kpi icon={Clock} label="Overdue inspections" value={DASHBOARD_KPIS.overdueInspections} accent="#fbbf24" />
        <Kpi icon={FileCheck} label="Quotes waiting" value={DASHBOARD_KPIS.quotesWaiting} accent="#60a5fa" href="/app/deficiencies?status=quote_sent" />
        <Kpi icon={DollarSign} label="Est. follow-up revenue" value={`$${DASHBOARD_KPIS.estFollowUpRevenue.toLocaleString()}`} accent="#34d399" />
        <Kpi icon={Mail} label="Follow-ups to send" value={DASHBOARD_KPIS.followUpsToday} accent="#a78bfa" href="/app/follow-ups" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Open deficiencies */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <div className="text-[14px] font-medium text-ink">Open deficiencies</div>
              <div className="text-[11.5px] text-faint mt-0.5">Your saved deficiency view</div>
            </div>
            <Link href="/app/deficiencies" className="text-[12px] text-muted hover:text-ink inline-flex items-center gap-1 transition-colors">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {openDeficiencies.map((d) => (
              <Link
                key={d.id}
                href={`/app/deficiencies/${d.id}`}
                className="block px-5 py-4 hover:bg-elevated transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <SeverityBadge {...SEVERITY_TONE[d.severity]} size="sm" dot={false} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[13.5px] font-medium text-ink truncate group-hover:text-fire3 transition-colors">
                        {d.customer}
                      </span>
                      <span className="text-[11px] text-faint">&middot;</span>
                      <span className="text-[12px] text-muted truncate">{d.systemType}</span>
                    </div>
                    <div className="text-[12.5px] text-ink2 leading-relaxed line-clamp-2">{d.description}</div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-faint">
                      <span>{d.id}</span>
                      <span>&middot;</span>
                      <span>Insp. {d.inspectionDate}</span>
                      {d.estimatedValue > 0 && (
                        <>
                          <span>&middot;</span>
                          <span className="text-pass">${d.estimatedValue.toLocaleString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <StatusPill status={d.status} className="shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Follow-up drafts */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden h-fit">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div>
              <div className="text-[14px] font-medium text-ink">Follow-up drafts</div>
              <div className="text-[11.5px] text-faint mt-0.5">Awaiting your approval</div>
            </div>
            <Link href="/app/follow-ups" className="text-[12px] text-muted hover:text-ink inline-flex items-center gap-1 transition-colors">
              Inbox <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {drafts.map((f) => (
              <Link key={f.id} href="/app/follow-ups" className="block px-5 py-4 hover:bg-elevated transition-colors">
                <div className="flex items-start gap-3">
                  <span className="mt-1 w-7 h-7 rounded-md bg-fire/10 border border-fire/20 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-fire3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium text-ink truncate">{f.customer}</div>
                    <div className="text-[12px] text-muted truncate mt-0.5">{f.subject}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border bg-bg/40">
            <div className="text-[11px] text-faint flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-pass" />
              Drafts only &mdash; nothing sends without approval
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
  href,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number | string;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-fire/30 hover:bg-elevated transition-all h-full">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center"
          style={{ background: `${accent}1A`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
        {href && <ArrowUpRight className="h-3.5 w-3.5 text-faint" />}
      </div>
      <div className="font-display text-2xl sm:text-3xl text-ink font-semibold tabular-nums tracking-tight">
        {value}
      </div>
      <div className="text-[11.5px] text-muted mt-1.5 leading-snug">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
