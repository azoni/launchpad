"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { isActive } from "@/lib/firebase/collections";
import {
  compareOpportunitiesByNext,
  formatPipelineDate,
  getNextRoundAt,
  nextStepLabel,
  parsePipelineDate,
  relativeDayLabel,
  todayStartMs,
} from "@/lib/pipeline";
import {
  DEFAULT_PIPELINE_FILTERS,
  PIPELINE_LOCATION_FILTERS,
  PIPELINE_STATUS_FILTERS,
  hasActivePipelineFilters,
  matchesPipelineFilters,
  type PipelineLocationFilter,
  type PipelineStatusFilter,
} from "@/lib/pipeline-filters";
import {
  NEGATIVE_CLOSED,
  PublicOppCard,
  type PublicOpportunity,
} from "@/components/profile/PublicOppCard";

const UPCOMING_LIMIT = 4;

export function ProfileBoard({
  opportunities,
}: {
  opportunities: PublicOpportunity[];
}) {
  const [locationFilter, setLocationFilter] = useState<PipelineLocationFilter>(
    DEFAULT_PIPELINE_FILTERS.location,
  );
  const [statusFilter, setStatusFilter] = useState<PipelineStatusFilter>(
    DEFAULT_PIPELINE_FILTERS.status,
  );
  const [showFilters, setShowFilters] = useState(false);
  const filters = useMemo(
    () => ({ location: locationFilter, status: statusFilter }),
    [locationFilter, statusFilter],
  );
  const filtersActive = hasActivePipelineFilters(filters);
  const activeFilterCount =
    (locationFilter !== DEFAULT_PIPELINE_FILTERS.location ? 1 : 0) +
    (statusFilter !== DEFAULT_PIPELINE_FILTERS.status ? 1 : 0);
  const clearFilters = () => {
    setLocationFilter(DEFAULT_PIPELINE_FILTERS.location);
    setStatusFilter(DEFAULT_PIPELINE_FILTERS.status);
  };

  const sorted = useMemo(
    () => [...opportunities].sort(compareOpportunitiesByNext),
    [opportunities],
  );

  // Upcoming strip — next scheduled rounds, ascending, future only.
  const upcoming = useMemo(
    () =>
      sorted
        .filter((o) => isActive(o.status))
        .map((o) => ({ opp: o, next: getNextRoundAt(o) }))
        .filter(({ next }) => {
          const ts = parsePipelineDate(next);
          return ts !== null && ts >= todayStartMs();
        })
        .sort((a, b) => parsePipelineDate(a.next)! - parsePipelineDate(b.next)!)
        .slice(0, UPCOMING_LIMIT),
    [sorted],
  );

  const filtered = useMemo(
    () => sorted.filter((o) => matchesPipelineFilters(o, filters)),
    [sorted, filters],
  );
  const open = filtered.filter((o) => isActive(o.status));
  const accepted = filtered.filter((o) => o.status === "accepted");
  const closedNegative = filtered.filter((o) => NEGATIVE_CLOSED.includes(o.status));

  if (opportunities.length === 0) return null;

  return (
    <>
      {/* Upcoming */}
      <section className="mt-8 chunky chunky-coral p-4 md:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="dy-eyebrow">upcoming</p>
          {upcoming.length > 0 && (
            <span className="dy-mono text-[color:var(--faded)]">{upcoming.length} next</span>
          )}
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-2 dy-mono text-[color:var(--faded)]">Nothing scheduled right now.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[color:var(--hairline)]">
            {upcoming.map(({ opp, next }) => {
              const rel = relativeDayLabel(next);
              const urgent = rel === "Today" || rel === "Tomorrow";
              const step = nextStepLabel(opp);
              return (
                <li
                  key={opp.id}
                  className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0"
                >
                  <div className="min-w-0">
                    <p
                      className="text-[15px] text-[color:var(--ink)] truncate"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {opp.company}
                    </p>
                    <p className="text-[12.5px] text-[color:var(--faded)] truncate">
                      {opp.role}
                      {step ? ` · ${step}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="dy-mono text-[color:var(--faded)]">
                      {formatPipelineDate(next, "")}
                    </span>
                    {rel && (
                      <span className={`dy-pill ${urgent ? "dy-pill-ink" : "dy-pill-neutral"}`}>
                        {rel}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Filters — compact disclosure, quiet by default */}
      <section className="mt-8">
        <div className="flex items-center flex-wrap gap-x-3 gap-y-2">
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className={`dy-pill ${filtersActive || showFilters ? "dy-pill-ink" : "dy-pill-outline"} hover:opacity-80 py-2`}
            aria-expanded={showFilters}
            aria-controls="profile-filter-panel"
          >
            <SlidersHorizontal size={13} />
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-[color:var(--paper)] text-[color:var(--ink)] text-[10px] font-semibold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
          {filtersActive && (
            <span className="text-sm text-[color:var(--ink-soft)]">
              {filtered.length} of {opportunities.length} shown
              <button
                type="button"
                onClick={clearFilters}
                className="ml-2 underline decoration-[color:var(--hairline-strong)] underline-offset-2 hover:decoration-[color:var(--primary)]"
              >
                Clear
              </button>
            </span>
          )}
        </div>
        {showFilters && (
          <div id="profile-filter-panel" className="mt-3 space-y-2 pop-in">
            <FilterGroup label="status">
              {PIPELINE_STATUS_FILTERS.map((filter) => (
                <FilterButton
                  key={filter.value}
                  active={statusFilter === filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </FilterButton>
              ))}
            </FilterGroup>
            <FilterGroup label="location">
              {PIPELINE_LOCATION_FILTERS.map((filter) => (
                <FilterButton
                  key={filter.value}
                  active={locationFilter === filter.value}
                  onClick={() => setLocationFilter(filter.value)}
                >
                  {filter.label}
                </FilterButton>
              ))}
            </FilterGroup>
          </div>
        )}
      </section>

      {filtersActive && filtered.length === 0 && (
        <div className="mt-4 chunky p-6 text-center">
          <p className="font-heading text-2xl">No items match those filters.</p>
          <p className="text-sm text-[color:var(--ink-soft)] mt-1">
            Clear filters or try a different status.
          </p>
        </div>
      )}

      {open.length > 0 && (
        <section className="mt-4">
          <SectionHeader title="Open pipeline" count={open.length} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {open.map((o) => (
              <PublicOppCard key={o.id} opp={o} />
            ))}
          </div>
        </section>
      )}

      {(accepted.length > 0 || closedNegative.length > 0) && (
        <section className="mt-8">
          <SectionHeader title="Closed outcomes" count={accepted.length + closedNegative.length} />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {accepted.map((o) => (
              <PublicOppCard key={o.id} opp={o} tone="positive" />
            ))}
            {closedNegative.map((o) => (
              <PublicOppCard key={o.id} opp={o} tone="negative" muted />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-[color:var(--hairline)]">
      <h2
        className="dy-display text-[20px] sm:text-[22px]"
        style={{ fontFamily: "var(--font-heading)", fontWeight: 500 }}
      >
        {title}
      </h2>
      {count !== undefined && <span className="dy-mono text-[color:var(--faded)]">{count}</span>}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="dy-eyebrow sm:w-20">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dy-pill ${active ? "dy-pill-ink" : "dy-pill-outline"} hover:opacity-80 py-2`}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
