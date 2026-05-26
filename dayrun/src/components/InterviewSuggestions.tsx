"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Plus, Sparkles, X } from "lucide-react";
import {
  INITIAL_STATUSES,
  type EventDoc,
  type InterviewRound,
  type OpportunityStatus,
} from "@/lib/firebase/collections";
import { guessCompany, isSuggestionCandidate } from "@/lib/interview-detect";
import type { User } from "firebase/auth";
import { useAuthUser } from "@/lib/auth";
import { parsePipelineDate, todayStartMs } from "@/lib/pipeline";
import { formatCalendarDay } from "@/lib/calendar-time";

type Group = {
  /** company guess (or "?" if unknown) */
  company: string;
  /** stable key for React */
  key: string;
  events: EventDoc[];
};

function bucketByCompany(events: EventDoc[]): Group[] {
  const map = new Map<string, Group>();
  for (const ev of events) {
    const company = guessCompany(ev) ?? "?";
    const key = company.toLowerCase();
    if (!map.has(key)) map.set(key, { company, key, events: [] });
    map.get(key)!.events.push(ev);
  }
  // Multi-event groups first; unknowns last
  return [...map.values()].sort((a, b) => {
    if ((a.company === "?") !== (b.company === "?")) return a.company === "?" ? 1 : -1;
    if (a.events.length !== b.events.length) return b.events.length - a.events.length;
    return a.company.localeCompare(b.company);
  });
}

export function InterviewSuggestions({
  events,
  onCreated,
}: {
  events: EventDoc[];
  onCreated?: (id: string) => void;
}) {
  const { user } = useAuthUser();
  const candidates = useMemo(
    () => events.filter(isSuggestionCandidate).slice(0, 30),
    [events],
  );

  // LLM fallback: resolve any "?" groups to a name when possible.
  const [llmGuesses, setLlmGuesses] = useState<Record<string, string>>({});
  const [llmAsked, setLlmAsked] = useState(false);

  useEffect(() => {
    if (llmAsked || !user || candidates.length === 0) return;
    const unknowns = candidates.filter((e) => !guessCompany(e));
    if (unknowns.length === 0) return;
    setLlmAsked(true);
    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/event/guess-company", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            items: unknowns.slice(0, 20).map((e) => ({
              id: e.googleEventId,
              summary: e.summary,
              location: e.location,
            })),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { guesses?: Record<string, string> };
        if (!cancelled && data.guesses) setLlmGuesses(data.guesses);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, user]);

  // Apply LLM guesses by injecting them into the events before bucketing.
  const enriched = useMemo(
    () =>
      candidates.map((e) => {
        const llm = llmGuesses[e.googleEventId];
        if (llm && !guessCompany(e)) {
          // Synthesize attendeeDomain so guessCompany() returns it next pass.
          return { ...e, attendeeDomain: llm };
        }
        return e;
      }),
    [candidates, llmGuesses],
  );

  const groups = useMemo(() => bucketByCompany(enriched), [enriched]);
  if (groups.length === 0) return null;

  return (
    <section className="chunky chunky-grape p-4 md:p-5">
      <header className="flex items-start gap-2 mb-3">
        <Lightbulb size={20} className="text-grape shrink-0 mt-0.5" />
        <div>
          <h2 className="font-heading text-xl font-bold">Looks like an interview?</h2>
          <p className="text-sm text-muted-foreground">
            {candidates.length === 1
              ? "Found one calendar event that smells like an interview but isn't tracked yet."
              : `Found ${candidates.length} calendar events that look like interviews but aren't tracked yet.`}{" "}
            One-tap to add to your pipeline.
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {groups.map((g) => (
          <SuggestionGroup
            key={g.key}
            group={g}
            user={user}
            llmGuessed={Object.keys(llmGuesses).length > 0 && g.events.some((e) => llmGuesses[e.googleEventId])}
            onCreated={onCreated}
          />
        ))}
      </div>
    </section>
  );
}

function SuggestionGroup({
  group,
  user,
  llmGuessed,
  onCreated,
}: {
  group: Group;
  user: User | null;
  llmGuessed: boolean;
  onCreated?: (id: string) => void;
}) {
  const initialCompany = group.company === "?" ? "" : group.company;
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState(initialCompany);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<OpportunityStatus>("ongoing");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingDismiss, setPendingDismiss] = useState<Set<string>>(new Set());

  async function dismiss(eventId: string) {
    if (!user) return;
    setPendingDismiss((s) => new Set(s).add(eventId));
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/event/dismiss-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ eventId, dismissed: true }),
      });
    } finally {
      setPendingDismiss((s) => {
        const next = new Set(s);
        next.delete(eventId);
        return next;
      });
    }
  }

  async function dismissAll() {
    if (!user) return;
    for (const ev of group.events) {
      await dismiss(ev.googleEventId);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const sourceLabel =
        group.events.length === 1
          ? `From calendar: "${group.events[0].summary}"`
          : `From ${group.events.length} calendar events`;
      const sortedEvents = [...group.events].sort((a, b) => {
        const aTs = parsePipelineDate(a.start) ?? 0;
        const bTs = parsePipelineDate(b.start) ?? 0;
        return aTs - bTs;
      });
      const floor = todayStartMs();
      const rounds: InterviewRound[] = sortedEvents.map((ev, index) => {
        const ts = parsePipelineDate(ev.start);
        return {
          id: `event_${ev.googleEventId.slice(0, 64)}`,
          eventId: ev.googleEventId,
          title: guessRoundTitle(ev.summary, index),
          scheduledAt: ev.start,
          outcome: ts !== null && ts < floor ? "completed" : "scheduled",
          publicNote: null,
        };
      });
      const firstRoundAt = sortedEvents[0]?.start ?? null;
      const nextRoundAt = sortedEvents.find((ev) => {
        const ts = parsePipelineDate(ev.start);
        return ts !== null && ts >= floor;
      })?.start ?? null;
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          status,
          source: sourceLabel,
          firstRoundAt,
          nextRoundAt,
          interviewRounds: rounds,
          isPublic: true,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onCreated?.(data.opportunity.id);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  }

  const isMulti = group.events.length > 1;
  const visibleEvents = group.events.filter((e) => !pendingDismiss.has(e.googleEventId));
  if (visibleEvents.length === 0) return null;

  return (
    <div className="border-2 border-ink rounded-xl p-3 bg-card">
      <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-heading text-lg font-bold">
              {group.company === "?" ? "Unknown company" : group.company}
            </span>
            {isMulti && (
              <span className="text-xs font-mono text-muted-foreground">
                {visibleEvents.length} events
              </span>
            )}
            {llmGuessed && group.company !== "?" && (
              <span
                title="Company guessed by Claude"
                className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-grape border-2 border-dashed border-grape/40 rounded-full px-1.5"
              >
                <Sparkles size={10} /> AI
              </span>
            )}
          </div>
          {!isMulti && (
            <p className="text-sm text-muted-foreground break-words mt-0.5">
              {visibleEvents[0].summary}
            </p>
          )}
        </div>
        {!open && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setOpen(true)}
              className="btn-chunky text-xs py-1.5 px-3 min-h-[36px]"
            >
              <Plus size={13} />
              {isMulti
                ? `Add all ${visibleEvents.length}`
                : initialCompany
                  ? `Add ${initialCompany}`
                  : "Add to pipeline"}
            </button>
            <button
              onClick={isMulti ? dismissAll : () => dismiss(visibleEvents[0].googleEventId)}
              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-full border-2 border-ink bg-card hover:bg-muted text-muted-foreground"
              title={isMulti ? "Dismiss all in this group" : "Not an interview"}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Event list for multi-event groups */}
      {isMulti && !open && (
        <ul className="space-y-1 mt-2">
          {visibleEvents.map((ev) => (
            <li
              key={ev.googleEventId}
              className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
            >
              <span className="truncate">
                <span className="font-mono text-xs">
                  {formatCalendarDay(ev.start, { month: "short", day: "numeric" })}
                </span>{" "}
                · {ev.summary}
              </span>
              <button
                onClick={() => dismiss(ev.googleEventId)}
                className="text-muted-foreground hover:text-red-700 p-1"
                title="Dismiss this event from the suggestion"
                aria-label="Dismiss"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <form onSubmit={create} className="mt-3 pt-3 border-t-2 border-dashed border-ink/20 space-y-2">
          <div className="grid sm:grid-cols-3 gap-2">
            <label className="block text-xs sm:col-span-1">
              <span className="block font-semibold mb-1">Company *</span>
              <input
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="GEICO"
                className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
              />
            </label>
            <label className="block text-xs sm:col-span-1">
              <span className="block font-semibold mb-1">Role *</span>
              <input
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Staff Engineer"
                className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
              />
            </label>
            <label className="block text-xs sm:col-span-1">
              <span className="block font-semibold mb-1">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
                className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
              >
                {INITIAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="submit" disabled={submitting} className="btn-chunky text-sm py-2 px-3">
              {submitting ? "Adding…" : "Add to pipeline"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-chunky btn-ghost text-sm py-2 px-3"
            >
              Cancel
            </button>
            {error && <span className="text-xs font-semibold text-red-700">{error}</span>}
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            On create, {isMulti ? "all matching events auto-link" : "this event auto-links"} to the new pipeline item.
          </p>
        </form>
      )}
    </div>
  );
}

function guessRoundTitle(summary: string, index: number) {
  const s = summary.toLowerCase();
  if (s.includes("recruiter") || s.includes("phone") || s.includes("screen")) {
    return "Recruiter screen";
  }
  if (s.includes("technical") || s.includes("coding") || s.includes("code")) {
    return "Technical round";
  }
  if (s.includes("system") || s.includes("design")) return "System design";
  if (s.includes("manager") || s.includes("behavioral")) return "Hiring manager";
  if (s.includes("onsite") || s.includes("panel")) return "Onsite";
  if (s.includes("final")) return "Final round";
  return `Round ${index + 1}`;
}
