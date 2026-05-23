"use client";

import { useMemo, useState } from "react";
import { Lightbulb, Plus, X } from "lucide-react";
import {
  OPPORTUNITY_STATUSES,
  type EventDoc,
  type OpportunityStatus,
} from "@/lib/firebase/collections";
import { guessCompany, isSuggestionCandidate } from "@/lib/interview-detect";
import { useAuthUser } from "@/lib/auth";

export function InterviewSuggestions({
  events,
  onCreated,
}: {
  events: EventDoc[];
  /** Called after a pipeline item is created (so the dashboard can navigate / refresh). */
  onCreated?: (id: string) => void;
}) {
  const { user } = useAuthUser();
  const candidates = useMemo(
    () =>
      events
        .filter(isSuggestionCandidate)
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 8),
    [events],
  );
  if (candidates.length === 0) return null;

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
      <div className="space-y-2">
        {candidates.map((ev) => (
          <SuggestionRow
            key={ev.googleEventId}
            event={ev}
            user={user}
            onCreated={onCreated}
          />
        ))}
      </div>
    </section>
  );
}

function SuggestionRow({
  event,
  user,
  onCreated,
}: {
  event: EventDoc;
  user: ReturnType<typeof useAuthUser>["user"];
  onCreated?: (id: string) => void;
}) {
  const initialCompany = guessCompany(event.summary) ?? "";
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState(initialCompany);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<OpportunityStatus>("screen");
  const [submitting, setSubmitting] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function dismiss() {
    if (!user) return;
    setDismissing(true);
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/event/dismiss-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ eventId: event.googleEventId, dismissed: true }),
      });
    } finally {
      setDismissing(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          status,
          source: `From calendar: "${event.summary}"`,
          isPublic: false,
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

  const eventDate = new Date(event.start);
  const dateLabel = event.allDay
    ? eventDate.toLocaleDateString([], { month: "short", day: "numeric" })
    : eventDate.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

  return (
    <div className="border-2 border-ink rounded-xl p-3 bg-card">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="font-semibold break-words">{event.summary}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {!open && (
            <>
              <button
                onClick={() => setOpen(true)}
                className="btn-chunky text-xs py-1.5 px-3 min-h-[36px]"
              >
                <Plus size={13} />
                {initialCompany ? `Add ${initialCompany}` : "Add to pipeline"}
              </button>
              <button
                onClick={dismiss}
                disabled={dismissing}
                className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-full border-2 border-ink bg-card hover:bg-muted text-muted-foreground"
                title="Not an interview — dismiss this suggestion"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

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
                {OPPORTUNITY_STATUSES.map((s) => (
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
            On create, this event auto-links to the new pipeline item.
          </p>
        </form>
      )}
    </div>
  );
}
