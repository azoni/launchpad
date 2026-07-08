import {
  STATUS_ORDER,
  type Deficiency,
  type DeficiencyStatus,
  type Severity,
} from "@/lib/deficiencies";

/**
 * The customizable "history" view for the deficiencies list. Columns, sort, and filters are
 * data-driven here (not hardcoded in the page) so an inspector can show/hide/reorder columns,
 * choose a sort, save filter presets, and set a default — persisted per workspace.
 */

export type ColumnKey =
  | "severity"
  | "id"
  | "customer"
  | "finding"
  | "system"
  | "status"
  | "followUp"
  | "value"
  | "assignedTo"
  | "techName"
  | "inspected";

export type ColumnDef = {
  key: ColumnKey;
  label: string;
  /** grid track width for this column */
  width: string;
  align?: "right";
  sortable: boolean;
};

export const COLUMNS: Record<ColumnKey, ColumnDef> = {
  severity: { key: "severity", label: "Severity", width: "112px", sortable: true },
  id: { key: "id", label: "ID", width: "104px", sortable: true },
  customer: { key: "customer", label: "Customer / Property", width: "1.5fr", sortable: true },
  finding: { key: "finding", label: "Finding", width: "1fr", sortable: false },
  system: { key: "system", label: "System", width: "120px", sortable: true },
  status: { key: "status", label: "Status", width: "140px", sortable: true },
  followUp: { key: "followUp", label: "Follow-up", width: "120px", sortable: true },
  value: { key: "value", label: "Est. value", width: "116px", align: "right", sortable: true },
  assignedTo: { key: "assignedTo", label: "Assigned", width: "120px", sortable: true },
  techName: { key: "techName", label: "Tech", width: "120px", sortable: true },
  inspected: { key: "inspected", label: "Inspected", width: "120px", sortable: true },
};

/** Every column, in the order they appear in the customize panel. */
export const ALL_COLUMNS: ColumnKey[] = [
  "severity",
  "id",
  "customer",
  "finding",
  "system",
  "status",
  "followUp",
  "value",
  "assignedTo",
  "techName",
  "inspected",
];

export type SortDir = "asc" | "desc";
export type StatusFilter = "all" | "open" | DeficiencyStatus;
export type SeverityFilter = "all" | Severity;

export type DeficiencyView = {
  /** visible columns, in display order */
  visibleColumns: ColumnKey[];
  sort: { key: ColumnKey; dir: SortDir };
  filters: {
    q: string;
    status: StatusFilter;
    severity: SeverityFilter;
    customer: string;
  };
};

export type SavedPreset = { id: string; name: string; view: DeficiencyView };

export const DEFAULT_VIEW: DeficiencyView = {
  visibleColumns: ["severity", "id", "customer", "finding", "system", "status", "followUp", "value"],
  sort: { key: "severity", dir: "asc" },
  filters: { q: "", status: "open", severity: "all", customer: "all" },
};

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, major: 1, minor: 2 };

/** Comparable value for a deficiency on a given column (severity/status use rank order). */
export function sortValue(d: Deficiency, key: ColumnKey): string | number {
  switch (key) {
    case "severity":
      return SEVERITY_RANK[d.severity];
    case "status":
      return STATUS_ORDER.indexOf(d.status);
    case "value":
      return d.estimatedValue;
    case "id":
      return d.id;
    case "customer":
      return d.customer;
    case "system":
      return d.systemType;
    case "followUp":
      return d.nextFollowUp || "￿"; // empties sort last ascending
    case "assignedTo":
      return d.assignedTo;
    case "techName":
      return d.techName;
    case "inspected":
      return d.inspectionDate;
    default:
      return d.customer;
  }
}

function matchesFilters(d: Deficiency, f: DeficiencyView["filters"]): boolean {
  if (
    f.q &&
    !`${d.customer} ${d.property} ${d.description} ${d.id}`.toLowerCase().includes(f.q.toLowerCase())
  ) {
    return false;
  }
  if (f.status === "open" && ["resolved", "declined"].includes(d.status)) return false;
  if (f.status !== "all" && f.status !== "open" && d.status !== f.status) return false;
  if (f.severity !== "all" && d.severity !== f.severity) return false;
  if (f.customer !== "all" && d.customer !== f.customer) return false;
  return true;
}

/** Filter + sort a deficiency list according to a view. */
export function applyView(list: Deficiency[], view: DeficiencyView): Deficiency[] {
  const { key, dir } = view.sort;
  const mult = dir === "asc" ? 1 : -1;
  return list
    .filter((d) => matchesFilters(d, view.filters))
    .sort((a, b) => {
      const av = sortValue(a, key);
      const bv = sortValue(b, key);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      if (cmp !== 0) return cmp * mult;
      return a.id.localeCompare(b.id); // stable, direction-independent tiebreak
    });
}

const VALID_STATUS = new Set<string>([...STATUS_ORDER, "all", "open"]);
const VALID_SEVERITY = new Set<string>(["all", "critical", "major", "minor"]);

/** Drop unknown keys / de-dupe / clamp invalid values when hydrating a possibly-stale persisted view. */
export function normalizeView(v: Partial<DeficiencyView> | null | undefined): DeficiencyView {
  if (!v) return DEFAULT_VIEW;
  const seen = new Set<ColumnKey>();
  const visibleColumns = (v.visibleColumns ?? DEFAULT_VIEW.visibleColumns).filter(
    (k): k is ColumnKey => k in COLUMNS && !seen.has(k) && (seen.add(k), true)
  );
  const f: Partial<DeficiencyView["filters"]> = v.filters ?? {};
  return {
    visibleColumns: visibleColumns.length ? visibleColumns : DEFAULT_VIEW.visibleColumns,
    sort: {
      key: v.sort && v.sort.key in COLUMNS ? v.sort.key : DEFAULT_VIEW.sort.key,
      dir: v.sort && (v.sort.dir === "asc" || v.sort.dir === "desc") ? v.sort.dir : DEFAULT_VIEW.sort.dir,
    },
    filters: {
      q: typeof f.q === "string" ? f.q : DEFAULT_VIEW.filters.q,
      status: f.status && VALID_STATUS.has(f.status) ? f.status : DEFAULT_VIEW.filters.status,
      severity: f.severity && VALID_SEVERITY.has(f.severity) ? f.severity : DEFAULT_VIEW.filters.severity,
      customer: typeof f.customer === "string" ? f.customer : DEFAULT_VIEW.filters.customer,
    },
  };
}
