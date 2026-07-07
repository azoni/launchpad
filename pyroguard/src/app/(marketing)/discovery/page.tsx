"use client";
import { useState } from "react";
import { Download, Copy, Check, ClipboardList } from "lucide-react";

type FieldDef = { key: string; label: string; placeholder: string; type?: "textarea" | "text" };

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Company snapshot",
    fields: [
      { key: "company", label: "Company name", placeholder: "Acme Fire Protection", type: "text" },
      { key: "size", label: "Team size", placeholder: "12 techs, 3 office, 1 owner", type: "text" },
      { key: "verticals", label: "Customer mix", placeholder: "60% commercial, 25% multi-family, 15% industrial" },
    ],
  },
  {
    title: "Current systems",
    fields: [
      { key: "sor", label: "System of record", placeholder: "ServiceTrade — customers, jobs, invoicing" },
      { key: "reports", label: "Inspection reports", placeholder: "BuildingReports — submitted to AHJ" },
      { key: "forms", label: "Field forms / intake", placeholder: "Forms app — techs view + push to ServiceTrade on completion" },
      { key: "accounting", label: "Accounting / AR", placeholder: "QuickBooks (synced from ServiceTrade?)" },
      { key: "comms", label: "Customer communication", placeholder: "Email + phone — no shared thread between office and tech" },
      { key: "gaps", label: "What lives outside any system", placeholder: "Deficiency follow-ups, quote chase, overdue-inspection reminders, customer status questions" },
    ],
  },
  {
    title: "Where things fall through",
    fields: [
      { key: "pain", label: "Top 3 pain points", placeholder: "1. Deficiencies forgotten until next inspection\n2. Quotes sit unsent for weeks\n3. Inspections lapse without anyone noticing" },
      { key: "duplicate", label: "Duplicate data entry", placeholder: "Where is the same data typed twice?" },
      { key: "dropped", label: "What gets dropped most", placeholder: "Customer follow-ups after a deficiency is found" },
    ],
  },
  {
    title: "Reports & visibility",
    fields: [
      { key: "reportsToday", label: "What reports does the office want today?", placeholder: "Open deficiencies by customer; AR aging; inspections due in 30 days" },
      { key: "reportsHave", label: "What can you actually pull right now?", placeholder: "QuickBooks AR aging only; everything else manual" },
    ],
  },
  {
    title: "Pilot constraints",
    fields: [
      { key: "first", label: "Best first pilot scope", placeholder: "Deficiency follow-up tracker for 1 customer segment" },
      { key: "data", label: "Data we can use safely", placeholder: "Anonymized export of last 6 months of inspections" },
      { key: "risks", label: "Risks / concerns", placeholder: "Customer privacy, AHJ liability, busy season starts in 6 weeks" },
      { key: "deadline", label: "Decision timing", placeholder: "Need to decide on direction by mid-June" },
    ],
  },
];

export default function DiscoveryPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  function set(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function buildExport() {
    const date = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
    const lines: string[] = [];
    lines.push(`# Discovery — ${values.company || "Untitled"}`);
    lines.push(`_${date}_`);
    lines.push("");
    for (const s of SECTIONS) {
      lines.push(`## ${s.title}`);
      for (const f of s.fields) {
        lines.push(`**${f.label}**`);
        lines.push((values[f.key] || "_(not captured)_").trim());
        lines.push("");
      }
    }
    return lines.join("\n");
  }

  function copy() {
    navigator.clipboard.writeText(buildExport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([buildExport()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discovery-${(values.company || "untitled").toLowerCase().replace(/\s+/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container py-12 md:py-16 max-w-4xl animate-slide-in">
      <div className="flex items-start gap-4 mb-10">
        <span className="w-12 h-12 rounded-md bg-fire/10 border border-fire/20 flex items-center justify-center shrink-0">
          <ClipboardList className="h-5 w-5 text-fire" />
        </span>
        <div>
          <div className="eyebrow mb-2">Discovery checklist</div>
          <h1 className="font-display text-3xl md:text-4xl text-ink font-semibold tracking-tight">
            Run the meeting, capture the ground truth.
          </h1>
          <p className="text-[14px] text-muted mt-3 max-w-2xl leading-relaxed">
            A structured set of questions to fill in during (or right after) a discovery call.
            Export as markdown for your follow-up notes &mdash; nothing leaves your browser.
          </p>
        </div>
      </div>

      <div className="space-y-6 mb-10">
        {SECTIONS.map((section, idx) => (
          <div key={section.title} className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
              <span className="font-display text-[15px] text-fire/70 font-semibold tabular-nums">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="text-[14px] font-medium text-ink">{section.title}</span>
            </div>
            <div className="p-5 grid gap-4 md:grid-cols-2">
              {section.fields.map((f) => (
                <label key={f.key} className={f.type === "textarea" || !f.type ? "md:col-span-2" : ""}>
                  <div className="text-[12px] text-muted mb-1.5 font-medium">{f.label}</div>
                  {f.type === "text" ? (
                    <input
                      value={values[f.key] || ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-[13.5px] text-ink placeholder:text-faint focus:border-fire/50 focus:outline-none transition-colors"
                    />
                  ) : (
                    <textarea
                      value={values[f.key] || ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full bg-bg border border-border rounded-md px-3 py-2.5 text-[13.5px] text-ink2 leading-relaxed placeholder:text-faint focus:border-fire/50 focus:outline-none transition-colors"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12.5px] text-muted">
          Captures live in your browser only. Export to keep, share, or paste into your own notes.
        </div>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="border border-border hover:border-muted text-ink px-4 py-2.5 rounded-md text-[12.5px] font-medium inline-flex items-center gap-2 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-pass" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy markdown"}
          </button>
          <button
            onClick={download}
            className="bg-fire hover:bg-fire2 text-white px-4 py-2.5 rounded-md text-[12.5px] font-medium inline-flex items-center gap-2 transition-colors shadow-glow"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
