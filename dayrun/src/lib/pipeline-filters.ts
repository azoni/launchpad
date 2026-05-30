import {
  LOCATION_TYPES,
  normalizeOpportunityStatus,
  type LocationType,
  type OpportunityDoc,
} from "@/lib/firebase/collections";

export const PIPELINE_STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "awaiting", label: "Awaiting" },
  { value: "ongoing", label: "Ongoing" },
  { value: "action", label: "Action needed" },
  { value: "rejected", label: "Rejected" },
  { value: "accepted", label: "Accepted" },
] as const;

export type PipelineStatusFilter = (typeof PIPELINE_STATUS_FILTERS)[number]["value"];

export const PIPELINE_LOCATION_FILTERS = [
  { value: "all", label: "All" },
  ...LOCATION_TYPES.map((location) => ({ value: location, label: location })),
] as const satisfies readonly { value: "all" | LocationType; label: string }[];

export type PipelineLocationFilter = (typeof PIPELINE_LOCATION_FILTERS)[number]["value"];

export type PipelineFilters = {
  location: PipelineLocationFilter;
  status: PipelineStatusFilter;
};

export const DEFAULT_PIPELINE_FILTERS: PipelineFilters = {
  location: "all",
  status: "all",
};

export function normalizePipelineStatusFilter(value: unknown): PipelineStatusFilter {
  return PIPELINE_STATUS_FILTERS.some((filter) => filter.value === value)
    ? (value as PipelineStatusFilter)
    : DEFAULT_PIPELINE_FILTERS.status;
}

export function normalizePipelineLocationFilter(value: unknown): PipelineLocationFilter {
  return PIPELINE_LOCATION_FILTERS.some((filter) => filter.value === value)
    ? (value as PipelineLocationFilter)
    : DEFAULT_PIPELINE_FILTERS.location;
}

export function matchesPipelineFilters(opp: OpportunityDoc, filters: PipelineFilters): boolean {
  if (filters.location !== "all" && opp.locationType !== filters.location) return false;
  if (filters.status === "all") return true;

  const status = normalizeOpportunityStatus(opp.status);
  const hasOpenActionItems = opp.hasOpenActionItems === true;

  switch (filters.status) {
    case "action":
      return (
        hasOpenActionItems &&
        status !== "accepted" &&
        status !== "rejected" &&
        status !== "withdrew" &&
        status !== "ghosted"
      );
    case "awaiting":
      return status === "awaiting" && !hasOpenActionItems;
    case "ongoing":
      return status === "ongoing" && !hasOpenActionItems;
    case "rejected":
      return status === "rejected";
    case "accepted":
      return status === "accepted";
    default:
      return true;
  }
}

export function hasActivePipelineFilters(filters: PipelineFilters): boolean {
  return (
    filters.location !== DEFAULT_PIPELINE_FILTERS.location ||
    filters.status !== DEFAULT_PIPELINE_FILTERS.status
  );
}
