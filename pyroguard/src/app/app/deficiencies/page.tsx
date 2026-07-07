"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Filter as FilterIcon, ChevronDown } from "lucide-react";
import {
  DEFICIENCIES, STATUS_LABEL, STATUS_COLOR, SEVERITY_COLOR, STATUS_ORDER,
  type DeficiencyStatus, type Severity,
} from "@/lib/deficiencies";

type StatusFilter = "all" | "open" | DeficiencyStatus;
type SeverityFilter = "all" | Severity;

export default function DeficienciesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [severity, setSeverity] = useState<SeverityFilter>("all");
  const [customer, setCustomer] = useState<string>("all");

  const customers = useMemo(
    () => Array.from(new Set(DEFICIENCIES.map((d) => d.customer))).sort(),
    []
  );

  const rows = useMemo(() => {
    return DEFICIENCIES.filter((d) => {
      if (q && !`${d.customer} ${d.property} ${d.description} ${d.id}`.toLowerCase().includes(q.toLowerCase())) {
        return false;
      }
      if (status === "open" && ["resolved", "declined"].includes(d.status)) return false;
      if (status !== "all" && status !== "open" && d.status !== status) return false;
      if (severity !== "all" && d.severity !== severity) return false;
      if (customer !== "all" && d.customer !== customer) return false;
      return true;
    }).sort((a, b) => {
      const sev = { critical: 0, major: 1, minor: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return a.nextFollowUp.localeCompare(b.nextFollowUp);
    });
  }, [q, status, severity, customer]);

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto animate-slide-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="eyebrow mb-2">Workflow</div>
          <h1 className="font-display text-3xl text-ink font-semibold tracking-tight">Deficiencies</h1>
          <p className="text-[13.5px] text-muted mt-1.5">
            Open findings across all customers, with follow-up status and ownership.
          </p>
        </div>
        <div className="text-[12px] text-muted">
          <span className="text-ink font-medium">{rows.length}</span> showing &middot;{" "}
          <span className="text-ink font-medium">{DEFICIENCIES.length}</span> total
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-lg p-3 mb-4 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search customer, property, or finding..."
            className="w-full bg-bg border border-border rounded-md pl-9 pr-3 py-2 text-[13px] text-ink placeholder:text-faint focus:border-fire/50 focus:outline-none transition-colors"
          />
        </div>
        <Select
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            { value: "open", label: "Open only" },
            { value: "all", label: "All statuses" },
            ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
          ]}
        />
        <Select
          label="Severity"
          value={severity}
          onChange={(v) => setSeverity(v as SeverityFilter)}
          options={[
            { value: "all", label: "All severities" },
            { value: "critical", label: "Critical" },
            { value: "major", label: "Major" },
            { value: "minor", label: "Minor" },
          ]}
        />
        <Select
          label="Customer"
          value={customer}
          onChange={setCustomer}
          options={[
            { value: "all", label: "All customers" },
            ...customers.map((c) => ({ value: c, label: c })),
          ]}
        />
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="hidden md:grid grid-cols-[120px_1.5fr_1fr_120px_140px_120px_120px] gap-3 px-5 py-3 text-[10.5px] tracking-widest2 uppercase text-faint border-b border-border bg-bg/40">
          <div>ID</div>
          <div>Customer / Property</div>
          <div>Finding</div>
          <div>System</div>
          <div>Status</div>
          <div>Follow-up</div>
          <div className="text-right">Est. value</div>
        </div>

        {rows.length === 0 && (
          <div className="px-5 py-16 text-center text-muted text-[13px]">
            No deficiencies match these filters.
          </div>
        )}

        <div className="divide-y divide-border">
          {rows.map((d) => {
            const sc = STATUS_COLOR[d.status];
            const sev = SEVERITY_COLOR[d.severity];
            return (
              <Link
                key={d.id}
                href={`/app/deficiencies/${d.id}`}
                className="md:grid md:grid-cols-[120px_1.5fr_1fr_120px_140px_120px_120px] flex flex-col gap-3 px-5 py-4 hover:bg-elevated transition-colors text-[13px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: sev.dot }}
                    title={sev.label}
                  />
                  <span className="font-mono text-[11.5px] text-faint">{d.id}</span>
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-ink truncate">{d.customer}</div>
                  <div className="text-[11.5px] text-faint truncate">{d.property}</div>
                </div>
                <div className="text-ink2 line-clamp-2">{d.description}</div>
                <div className="text-muted text-[12px]">{d.systemType}</div>
                <div>
                  <span
                    className="inline-flex px-2.5 py-1 rounded-md text-[10.5px] tracking-wide font-medium"
                    style={{ background: sc.bg, color: sc.text, boxShadow: `inset 0 0 0 1px ${sc.ring}` }}
                  >
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
                <div className="text-muted text-[12px] tabular-nums">
                  {d.nextFollowUp || "—"}
                </div>
                <div className="text-right text-pass tabular-nums">
                  {d.estimatedValue > 0 ? `$${d.estimatedValue.toLocaleString()}` : "—"}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex items-center gap-2 bg-bg border border-border rounded-md px-3 py-2 text-[12.5px] hover:border-muted transition-colors cursor-pointer">
      <FilterIcon className="h-3 w-3 text-faint" />
      <span className="text-faint">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-ink outline-none appearance-none pr-5 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg text-ink">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 text-faint absolute right-2 pointer-events-none" />
    </label>
  );
}
