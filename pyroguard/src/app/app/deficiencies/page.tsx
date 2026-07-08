"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Search, Filter as FilterIcon, ChevronDown, SlidersHorizontal,
  ArrowUp, ArrowDown, Star, Trash2, Check, X,
} from "lucide-react";
import {
  DEFICIENCIES, STATUS_LABEL, STATUS_ORDER, SEVERITY_TONE,
  type Deficiency,
} from "@/lib/deficiencies";
import {
  COLUMNS, ALL_COLUMNS, DEFAULT_VIEW, applyView, type ColumnKey,
} from "@/lib/deficiencies-view";
import { useWorkspace } from "@/lib/store/workspace";
import { useDeficiencyPrefs, useDeficiencyPrefsSync } from "@/lib/store/prefs";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { StatusPill } from "@/components/ui/status-pill";

const VALID_STATUS = new Set<string>([...STATUS_ORDER, "all", "open"]);
const VALID_SEVERITY = new Set<string>(["all", "critical", "major", "minor"]);

export default function DeficienciesPage() {
  const { workspaceId } = useWorkspace();
  useDeficiencyPrefsSync(workspaceId);

  const storedView = useDeficiencyPrefs((s) => s.deficiencyView);
  const savedPresets = useDeficiencyPrefs((s) => s.savedPresets);
  const defaultPresetId = useDeficiencyPrefs((s) => s.defaultPresetId);
  const patchView = useDeficiencyPrefs((s) => s.patchView);
  const savePreset = useDeficiencyPrefs((s) => s.savePreset);
  const applyPreset = useDeficiencyPrefs((s) => s.applyPreset);
  const setDefaultPreset = useDeficiencyPrefs((s) => s.setDefaultPreset);
  const deletePreset = useDeficiencyPrefs((s) => s.deletePreset);
  const resetView = useDeficiencyPrefs((s) => s.resetView);

  // Render the default view until mounted so the first client paint matches the SSR HTML
  // (localStorage-persisted prefs would otherwise cause a hydration mismatch / column flash).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const view = hydrated ? storedView : DEFAULT_VIEW;

  const [panelOpen, setPanelOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Honor dashboard deep-links like /app/deficiencies?status=quote_sent (previously ignored).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const status = sp.get("status");
    const severity = sp.get("severity");
    const next: Partial<typeof view.filters> = {};
    if (status && VALID_STATUS.has(status)) next.status = status as typeof view.filters.status;
    if (severity && VALID_SEVERITY.has(severity)) next.severity = severity as typeof view.filters.severity;
    if (Object.keys(next).length) {
      patchView({ filters: { ...useDeficiencyPrefs.getState().deficiencyView.filters, ...next } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customers = useMemo(
    () => Array.from(new Set(DEFICIENCIES.map((d) => d.customer))).sort(),
    []
  );

  const rows = useMemo(() => applyView(DEFICIENCIES, view), [view]);

  const visibleCols = view.visibleColumns.filter((k) => COLUMNS[k]); // defense-in-depth vs stale keys
  const template = visibleCols.map((k) => COLUMNS[k].width).join(" ");
  const f = view.filters;

  const setFilter = (patch: Partial<typeof f>) => patchView({ filters: { ...f, ...patch } });
  const toggleSort = (key: ColumnKey) => {
    if (!COLUMNS[key].sortable) return;
    patchView({
      sort: view.sort.key === key
        ? { key, dir: view.sort.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    });
  };

  return (
    <div className="px-5 sm:px-8 py-8 max-w-7xl mx-auto animate-slide-in">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="eyebrow mb-2">Workflow · History</div>
          <h1 className="font-display text-3xl text-ink font-semibold tracking-tight">Deficiencies</h1>
          <p className="text-[13.5px] text-muted mt-1.5">
            Open findings across all customers — customize the columns, sort, and saved views below.
          </p>
        </div>
        <div className="text-[12px] text-muted">
          <span className="text-ink font-medium">{rows.length}</span> showing &middot;{" "}
          <span className="text-ink font-medium">{DEFICIENCIES.length}</span> total
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-lg p-3 mb-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-faint" />
          <input
            value={f.q}
            onChange={(e) => setFilter({ q: e.target.value })}
            placeholder="Search customer, property, or finding..."
            className="w-full bg-bg border border-border rounded-md pl-9 pr-3 py-2 text-[13px] text-ink placeholder:text-faint focus:border-fire/50 focus:outline-none transition-colors"
          />
        </div>
        <Select
          label="Status" value={f.status}
          onChange={(v) => setFilter({ status: v as typeof f.status })}
          options={[
            { value: "open", label: "Open only" },
            { value: "all", label: "All statuses" },
            ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
          ]}
        />
        <Select
          label="Severity" value={f.severity}
          onChange={(v) => setFilter({ severity: v as typeof f.severity })}
          options={[
            { value: "all", label: "All severities" },
            { value: "critical", label: "Critical" },
            { value: "major", label: "Major" },
            { value: "minor", label: "Minor" },
          ]}
        />
        <Select
          label="Customer" value={f.customer}
          onChange={(v) => setFilter({ customer: v })}
          options={[{ value: "all", label: "All customers" }, ...customers.map((c) => ({ value: c, label: c }))]}
        />
        <button
          onClick={() => setPanelOpen((o) => !o)}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-[12.5px] border transition-colors ${
            panelOpen ? "border-fire/50 text-ink bg-fire/5" : "border-border text-muted hover:text-ink hover:border-muted"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Customize
        </button>
      </div>

      {panelOpen && (
        <CustomizePanel
          view={view}
          savedPresets={savedPresets}
          defaultPresetId={defaultPresetId}
          presetName={presetName}
          setPresetName={setPresetName}
          onToggleColumn={(k) => {
            const visible = view.visibleColumns.includes(k);
            patchView({
              visibleColumns: visible
                ? view.visibleColumns.filter((c) => c !== k)
                : [...view.visibleColumns, k],
            });
          }}
          onMoveColumn={(k, dir) => {
            const cols = [...view.visibleColumns];
            const i = cols.indexOf(k);
            const j = dir === "up" ? i - 1 : i + 1;
            if (j < 0 || j >= cols.length) return;
            [cols[i], cols[j]] = [cols[j], cols[i]];
            patchView({ visibleColumns: cols });
          }}
          onSavePreset={() => { savePreset(presetName); setPresetName(""); }}
          onApplyPreset={applyPreset}
          onSetDefault={setDefaultPreset}
          onDeletePreset={deletePreset}
          onReset={resetView}
        />
      )}

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden mt-3">
        <div
          className="hidden md:grid gap-3 px-5 py-3 text-[11px] tracking-widest2 uppercase text-muted border-b border-border bg-bg/40"
          style={{ gridTemplateColumns: template }}
        >
          {visibleCols.map((k) => {
            const col = COLUMNS[k];
            const active = view.sort.key === k;
            return (
              <button
                key={k}
                onClick={() => toggleSort(k)}
                disabled={!col.sortable}
                className={`flex items-center gap-1 ${col.align === "right" ? "justify-end text-right" : ""} ${
                  col.sortable ? "hover:text-ink" : "cursor-default"
                } ${active ? "text-fire3" : ""}`}
              >
                {col.label}
                {active && (view.sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
              </button>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="px-5 py-16 text-center text-muted text-[13px]">No deficiencies match these filters.</div>
        )}

        <div className="divide-y divide-border">
          {rows.map((d) => (
            <Link
              key={d.id}
              href={`/app/deficiencies/${d.id}`}
              className="md:grid flex flex-col gap-3 px-5 py-4 hover:bg-elevated transition-colors text-[13px]"
              style={{ gridTemplateColumns: template }}
            >
              {visibleCols.map((k) => (
                <Cell key={k} col={k} d={d} />
              ))}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ col, d }: { col: ColumnKey; d: Deficiency }) {
  switch (col) {
    case "severity":
      return <div><SeverityBadge {...SEVERITY_TONE[d.severity]} size="sm" /></div>;
    case "id":
      return <div className="font-mono text-[11.5px] text-faint self-center">{d.id}</div>;
    case "customer":
      return (
        <div className="min-w-0">
          <div className="font-medium text-ink truncate">{d.customer}</div>
          <div className="text-[11.5px] text-faint truncate">{d.property}</div>
        </div>
      );
    case "finding":
      return <div className="text-ink2 line-clamp-2 self-center">{d.description}</div>;
    case "system":
      return <div className="text-muted text-[12px] self-center">{d.systemType}</div>;
    case "status":
      return <div className="self-center"><StatusPill status={d.status} /></div>;
    case "followUp":
      return <div className="text-muted text-[12px] tabular-nums self-center">{d.nextFollowUp || "—"}</div>;
    case "value":
      return (
        <div className="text-right text-pass tabular-nums self-center">
          {d.estimatedValue > 0 ? `$${d.estimatedValue.toLocaleString()}` : "—"}
        </div>
      );
    case "assignedTo":
      return <div className="text-muted text-[12px] self-center truncate">{d.assignedTo}</div>;
    case "techName":
      return <div className="text-muted text-[12px] self-center truncate">{d.techName}</div>;
    case "inspected":
      return <div className="text-muted text-[12px] tabular-nums self-center">{d.inspectionDate}</div>;
    default:
      return null;
  }
}

function CustomizePanel({
  view, savedPresets, defaultPresetId, presetName, setPresetName,
  onToggleColumn, onMoveColumn, onSavePreset, onApplyPreset, onSetDefault, onDeletePreset, onReset,
}: {
  view: ReturnType<typeof useDeficiencyPrefs.getState>["deficiencyView"];
  savedPresets: { id: string; name: string }[];
  defaultPresetId: string | null;
  presetName: string;
  setPresetName: (v: string) => void;
  onToggleColumn: (k: ColumnKey) => void;
  onMoveColumn: (k: ColumnKey, dir: "up" | "down") => void;
  onSavePreset: () => void;
  onApplyPreset: (id: string) => void;
  onSetDefault: (id: string | null) => void;
  onDeletePreset: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="bg-surface border border-fire/20 rounded-lg p-4 animate-fade-up grid gap-5 md:grid-cols-2">
      {/* Columns */}
      <div>
        <div className="tactical-label mb-2">Columns · drag order with ↑ ↓</div>
        <div className="space-y-1">
          {/* visible, in order */}
          {view.visibleColumns.map((k, i) => (
            <div key={k} className="flex items-center gap-2 bg-bg border border-border rounded-md px-2.5 py-1.5">
              <button onClick={() => onToggleColumn(k)} className="text-pass shrink-0" aria-label={`Hide ${COLUMNS[k].label}`}>
                <Check className="h-3.5 w-3.5" />
              </button>
              <span className="text-[12.5px] text-ink flex-1 truncate">{COLUMNS[k].label}</span>
              <button onClick={() => onMoveColumn(k, "up")} disabled={i === 0} className="text-faint hover:text-ink disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => onMoveColumn(k, "down")} disabled={i === view.visibleColumns.length - 1} className="text-faint hover:text-ink disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {/* hidden columns */}
          {ALL_COLUMNS.filter((k) => !view.visibleColumns.includes(k)).map((k) => (
            <div key={k} className="flex items-center gap-2 px-2.5 py-1.5 opacity-60">
              <button onClick={() => onToggleColumn(k)} className="text-faint shrink-0" aria-label={`Show ${COLUMNS[k].label}`}>
                <span className="inline-block h-3.5 w-3.5 rounded-sm border border-faint" />
              </button>
              <span className="text-[12.5px] text-muted flex-1 truncate">{COLUMNS[k].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div>
        <div className="tactical-label mb-2">Saved views</div>
        <div className="flex gap-2 mb-3">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && presetName.trim()) onSavePreset(); }}
            placeholder="Name this view…"
            className="flex-1 bg-bg border border-border rounded-md px-3 py-1.5 text-[12.5px] text-ink placeholder:text-faint focus:border-fire/50 focus:outline-none"
          />
          <button
            onClick={onSavePreset}
            disabled={!presetName.trim()}
            className="rounded-md px-3 py-1.5 text-[12px] tracking-wide bg-fire text-white disabled:opacity-40 hover:bg-fire3 transition-colors"
          >
            Save
          </button>
        </div>
        <div className="space-y-1">
          {savedPresets.length === 0 && (
            <div className="text-[12px] text-faint">No saved views yet. Configure filters + columns, then save.</div>
          )}
          {savedPresets.map((p) => (
            <div key={p.id} className="flex items-center gap-2 bg-bg border border-border rounded-md px-2.5 py-1.5">
              <button onClick={() => onApplyPreset(p.id)} className="text-[12.5px] text-ink flex-1 text-left truncate hover:text-fire3">{p.name}</button>
              <button
                onClick={() => onSetDefault(defaultPresetId === p.id ? null : p.id)}
                className={defaultPresetId === p.id ? "text-warn" : "text-faint hover:text-ink"}
                title={defaultPresetId === p.id ? "Default view" : "Set as default"}
              >
                <Star className="h-3.5 w-3.5" fill={defaultPresetId === p.id ? "currentColor" : "none"} />
              </button>
              <button onClick={() => onDeletePreset(p.id)} className="text-faint hover:text-fire3" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={onReset} className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink">
          <X className="h-3.5 w-3.5" /> Reset to default
        </button>
      </div>
    </div>
  );
}

function Select({
  label, value, onChange, options,
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
          <option key={o.value} value={o.value} className="bg-bg text-ink">{o.label}</option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 text-faint absolute right-2 pointer-events-none" />
    </label>
  );
}
