"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  Check,
  ClipboardList,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/auth";
import {
  COLLECTIONS,
  INTERVIEW_ROUND_OUTCOMES,
  LOCATION_TYPES,
  OPPORTUNITY_STATUSES,
  type ChecklistItem,
  type Compensation,
  type Contact,
  type EventDoc,
  type InterviewRound,
  type InterviewRoundOutcome,
  type LocationType,
  type OpportunityDoc,
  type OpportunityPrivateDoc,
  type OpportunityStatus,
} from "@/lib/firebase/collections";
import { BriefCard } from "@/components/pipeline/BriefCard";
import {
  parsePipelineDate,
  todayStartMs,
  toDateInputValue,
  visibleRounds,
  getRoundNumber,
} from "@/lib/pipeline";
import { formatCalendarDateTime } from "@/lib/calendar-time";

type PageProps = { params: Promise<{ id: string }> };

export default function OpportunityDetailPage(props: PageProps) {
  const { id } = use(props.params);
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [opp, setOpp] = useState<OpportunityDoc | null>(null);
  const [priv, setPriv] = useState<OpportunityPrivateDoc>({ notes: "", feedback: "", contacts: [], brief: null });
  const [linkedEvents, setLinkedEvents] = useState<EventDoc[]>([]);
  const [, setSavingPatch] = useState<Record<string, boolean>>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to main doc.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, COLLECTIONS.opportunities(user.uid), id);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setOpp({ id: snap.id, ...snap.data() } as OpportunityDoc);
      else setOpp(null);
    });
    return () => unsub();
  }, [user, id]);

  // Subscribe to private subdoc.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, COLLECTIONS.opportunityPrivate(user.uid, id), "data");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data() as Partial<OpportunityPrivateDoc>;
        setPriv({
          notes: d.notes ?? "",
          feedback: d.feedback ?? "",
          contacts: d.contacts ?? [],
          brief: d.brief ?? null,
          compensation: d.compensation ?? null,
          checklist: d.checklist ?? [],
        });
      }
    });
    return () => unsub();
  }, [user, id]);

  // Subscribe to linked events.
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, COLLECTIONS.events(user.uid)),
      where("opportunityId", "==", id),
    );
    const unsub = onSnapshot(q, (snap) => {
      const evs = snap.docs.map((d) => d.data() as EventDoc);
      evs.sort((a, b) => a.start.localeCompare(b.start));
      setLinkedEvents(evs);
    });
    return () => unsub();
  }, [user, id]);

  const sortedEvents = useMemo(() => linkedEvents, [linkedEvents]);

  async function patch(update: Partial<OpportunityDoc & OpportunityPrivateDoc>, key: string) {
    if (!user) return;
    setSavingPatch((s) => ({ ...s, [key]: true }));
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/pipeline/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error(await res.text());
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingPatch((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    }
  }

  function saveRounds(rounds: InterviewRound[]) {
    const dated = rounds
      .filter((round) => parsePipelineDate(round.scheduledAt) !== null)
      .sort((a, b) => parsePipelineDate(a.scheduledAt)! - parsePipelineDate(b.scheduledAt)!);
    const firstRoundAt = dated[0]?.scheduledAt ?? null;
    const nextRoundAt =
      dated.find((round) => {
        const ts = parsePipelineDate(round.scheduledAt);
        return (
          ts !== null &&
          ts >= todayStartMs() &&
          round.outcome !== "did-not-pass" &&
          round.outcome !== "cancelled"
        );
      })?.scheduledAt ?? null;
    patch({ interviewRounds: rounds, firstRoundAt, nextRoundAt }, "interviewRounds");
  }

  async function briefGenerate(contextHint: string) {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/pipeline/${id}/brief`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ contextHint: contextHint || undefined }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function briefEdit(content: string) {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/pipeline/${id}/brief`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function briefDelete() {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/pipeline/${id}/brief`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function remove() {
    if (!user) return;
    if (!confirm("Delete this pipeline item? Linked events will be unlinked, not deleted.")) return;
    setDeleting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/pipeline/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/app/pipeline");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  }

  if (loading) return <div className="chunky p-8">Loading…</div>;
  if (!user)
    return (
      <div className="chunky p-6">
        Please <Link href="/app" className="underline font-semibold">sign in</Link>.
      </div>
    );
  if (opp === null)
    return (
      <div className="chunky p-8 text-center">
        <p className="font-heading text-2xl mb-2">Not found.</p>
        <Link href="/app/pipeline" className="btn-chunky btn-ghost mt-2">
          ← Back to pipeline
        </Link>
      </div>
    );

  const actionItems = priv.checklist ?? [];
  const openActionItems = actionItems.filter((item) => item.done !== true).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/app/pipeline"
        className="text-sm text-muted-foreground hover:text-ink inline-flex items-center gap-1"
      >
        <ArrowLeft size={14} /> all pipeline items
      </Link>

      {/* Header */}
      <header className="chunky p-4 md:p-6 space-y-3">
        <div className="space-y-3">
          <div className="min-w-0">
            <EditableHeading
              value={opp.company}
              placeholder="Company"
              size="lg"
              onSave={(v) => patch({ company: v }, "company")}
            />
            <EditableHeading
              value={opp.role}
              placeholder="Role"
              size="sm"
              onSave={(v) => patch({ role: v }, "role")}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={opp.status}
              onChange={(e) => patch({ status: e.target.value as OpportunityStatus }, "status")}
              className="border-2 border-ink rounded-full px-3 py-2 bg-card font-semibold uppercase text-xs min-h-[36px]"
            >
              {OPPORTUNITY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={() => patch({ isPublic: !opp.isPublic }, "isPublic")}
              className={`min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-full border-2 border-ink text-xs font-bold ${
                opp.isPublic ? "bg-sun text-ink" : "bg-card text-muted-foreground"
              }`}
              title={
                opp.isPublic
                  ? "Hide from public profile (also hides linked events)"
                  : "Show on public profile (linked events become public too)"
              }
            >
              {opp.isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
              {opp.isPublic ? "public" : "private"}
            </button>
            {opp.isPublic && (
              <span className="text-[0.7rem] text-muted-foreground italic">
                linked events follow this toggle
              </span>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <FieldLabel label="Source">
            <InlineInput
              value={opp.source ?? ""}
              placeholder="Direct referral from..."
              onSave={(v) => patch({ source: v }, "source")}
            />
          </FieldLabel>
          <FieldLabel label="Posting link">
            <div className="flex items-center gap-2">
              <InlineInput
                value={opp.link ?? ""}
                placeholder="https://..."
                onSave={(v) => patch({ link: v }, "link")}
              />
              {opp.link && (
                <a
                  href={opp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-ink"
                  title="Open posting"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </FieldLabel>
          <FieldLabel label="Next step (shown publicly)">
            <InlineInput
              value={opp.nextStep ?? ""}
              placeholder="phone screen Thu 3pm"
              onSave={(v) => patch({ nextStep: v }, "nextStep")}
            />
          </FieldLabel>
          <FieldLabel label="First round date">
            <DateInput
              value={opp.firstRoundAt ?? ""}
              onSave={(v) => patch({ firstRoundAt: v }, "firstRoundAt")}
            />
          </FieldLabel>
          <FieldLabel label="Next round date">
            <DateInput
              value={opp.nextRoundAt ?? ""}
              onSave={(v) => patch({ nextRoundAt: v }, "nextRoundAt")}
            />
          </FieldLabel>
          <FieldLabel label="Expected rounds">
            <NumberInput
              value={opp.plannedRounds ?? null}
              onSave={(v) => patch({ plannedRounds: v }, "plannedRounds")}
            />
          </FieldLabel>
          <FieldLabel label="Next-step note">
            <InlineInput
              value={opp.nextStepBy ?? ""}
              placeholder="Recruiter follow-up, due date, prep reminder"
              onSave={(v) => patch({ nextStepBy: v }, "nextStepBy")}
            />
          </FieldLabel>
          <FieldLabel label="Location (shown publicly)">
            <select
              value={opp.locationType ?? ""}
              onChange={(e) =>
                patch(
                  { locationType: (e.target.value || null) as LocationType | null },
                  "locationType",
                )
              }
              className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
            >
              <option value="">— unspecified —</option>
              {LOCATION_TYPES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </FieldLabel>
        </div>

        {savedAt && (
          <p className="text-xs text-muted-foreground">
            Saved {new Date(savedAt).toLocaleTimeString()}.
          </p>
        )}
        {error && <p className="text-xs text-red-700 font-semibold">{error}</p>}
      </header>

      <PrivateBanner />

      <section className="chunky chunky-sun p-4 md:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="dy-eyebrow">focus</p>
            <h2 className="font-heading text-2xl font-bold mt-1 inline-flex items-center gap-2">
              <ClipboardList size={20} /> Action items
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Take-homes, follow-ups, prep work, and anything that needs to stay in front of you.
            </p>
          </div>
          <span className="dy-pill dy-pill-ink">
            {openActionItems} open
          </span>
        </div>
        <ChecklistEditor
          initial={actionItems}
          onSave={(c) => patch({ checklist: c }, "checklist")}
          placeholder="Add an action item, e.g. finish take-home, send thank-you, study system design..."
        />
      </section>

      <RoundTracker
        rounds={visibleRounds(opp)}
        linkedEvents={linkedEvents}
        onSave={saveRounds}
      />

      {/* Notes + Feedback */}
      <BriefCard
        brief={priv.brief ?? null}
        onGenerate={briefGenerate}
        onEdit={briefEdit}
        onDelete={briefDelete}
      />

      <section className="grid md:grid-cols-2 gap-4">
        <div className="chunky p-4">
          <h2 className="font-heading text-xl font-bold mb-2">Notes</h2>
          <NotesEditor
            initial={priv.notes}
            placeholder={`Process so far, blockers, study plan, take-home brief, anything…`}
            onSave={(v) => patch({ notes: v }, "notes")}
            rows={10}
          />
        </div>
        <div className="chunky p-4">
          <h2 className="font-heading text-xl font-bold mb-2">Feedback / reflection</h2>
          <NotesEditor
            initial={priv.feedback}
            placeholder={`How rounds went, recruiter's feedback, what to try differently…`}
            onSave={(v) => patch({ feedback: v }, "feedback")}
            rows={10}
          />
        </div>
      </section>

      {/* Compensation (private) */}
      <section className="chunky p-4">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <h2 className="font-heading text-xl font-bold">Compensation</h2>
          <span className="inline-flex items-center gap-1 text-[0.7rem] text-muted-foreground font-semibold">
            <EyeOff size={11} /> private
          </span>
        </div>
        <CompensationEditor
          initial={priv.compensation ?? { base: "", equity: "", other: "" }}
          onSave={(c) => patch({ compensation: c }, "compensation")}
        />
      </section>

      {/* Contacts */}
      <section className="chunky p-4">
        <h2 className="font-heading text-xl font-bold mb-2">Contacts</h2>
        <ContactsEditor
          initial={priv.contacts}
          onSave={(v) => patch({ contacts: v }, "contacts")}
        />
      </section>

      {/* Linked events */}
      <section className="chunky p-4">
        <h2 className="font-heading text-xl font-bold mb-2">Linked calendar events</h2>
        {sortedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No events linked yet. After your next sync, any calendar event whose title contains
            &ldquo;{opp.company}&rdquo; will auto-link here.
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedEvents.map((ev) => (
              <li key={ev.googleEventId} className="text-sm border-2 border-ink rounded-xl p-3 bg-card">
                <p className="font-semibold">{ev.summary}</p>
                <p className="text-muted-foreground text-xs">
                  {formatCalendarDateTime(ev)}
                  {ev.location ? ` · ${ev.location}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Danger */}
      <section className="pt-2">
        <button
          onClick={remove}
          disabled={deleting}
          className="text-sm text-red-700 hover:underline inline-flex items-center gap-1"
        >
          <Trash2 size={14} /> {deleting ? "Deleting…" : "Delete this item"}
        </button>
      </section>
    </div>
  );
}

function PrivateBanner() {
  return (
    <div className="text-xs text-muted-foreground inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-dashed border-muted-foreground/40 bg-card">
      <EyeOff size={12} /> notes, feedback, and contacts are always private — never shown on your
      public profile, even if this item is public.
    </div>
  );
}

function RoundTracker({
  rounds,
  linkedEvents,
  onSave,
}: {
  rounds: InterviewRound[];
  linkedEvents: EventDoc[];
  onSave: (rounds: InterviewRound[]) => void;
}) {
  const [items, setItems] = useState<InterviewRound[]>(rounds);

  function normalizedRoundNumber(value: unknown, fallback: number): number {
    const n =
      typeof value === "number"
        ? value
        : typeof value === "string" && value.trim()
          ? Number(value)
          : fallback;
    if (!Number.isFinite(n)) return fallback;
    return Math.min(99, Math.max(1, Math.trunc(n)));
  }

  function normalizeRounds(next: InterviewRound[]): InterviewRound[] {
    return next.map((round, index) => ({
      ...round,
      roundNumber: normalizedRoundNumber(round.roundNumber, index + 1),
    }));
  }

  function nextRoundNumber(offset = 0): number {
    const max = items.reduce((acc, item, index) => {
      return Math.max(acc, getRoundNumber(item, index + 1) ?? index + 1);
    }, 0);
    return Math.min(99, max + 1 + offset);
  }

  function commit(next: InterviewRound[]) {
    const normalized = normalizeRounds(next);
    setItems(normalized);
    onSave(normalized);
  }

  function update(id: string, patch: Partial<InterviewRound>) {
    commit(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addRound(seed?: Partial<InterviewRound>) {
    const next: InterviewRound = {
      id: `round_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      roundNumber: seed?.roundNumber ?? nextRoundNumber(),
      title: seed?.title ?? `Round ${items.length + 1}`,
      scheduledAt: seed?.scheduledAt ?? null,
      outcome: seed?.outcome ?? "scheduled",
      publicNote: seed?.publicNote ?? null,
      eventId: seed?.eventId ?? null,
    };
    commit([...items, next]);
  }

  function addLinkedEvents() {
    const existingEventIds = new Set(items.map((item) => item.eventId).filter(Boolean));
    const additions = linkedEvents
      .filter((event) => !existingEventIds.has(event.googleEventId))
      .map((event, index): InterviewRound => {
        const ts = parsePipelineDate(event.start);
        return {
          id: `event_${event.googleEventId.slice(0, 64)}`,
          eventId: event.googleEventId,
          roundNumber: nextRoundNumber(index),
          title: guessRoundTitle(event.summary, items.length + index),
          scheduledAt: event.start,
          outcome: ts !== null && ts < todayStartMs() ? "completed" : "scheduled",
          publicNote: null,
        };
      });
    if (additions.length > 0) commit([...items, ...additions]);
  }

  const untrackedLinkedCount = linkedEvents.filter(
    (event) => !items.some((item) => item.eventId === event.googleEventId),
  ).length;

  return (
    <section className="chunky chunky-coral p-4 md:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="dy-eyebrow">process</p>
          <h2 className="font-heading text-2xl font-bold mt-1">Interview rounds</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track the part you just finished, then set the next date so the pipeline stays ordered.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {untrackedLinkedCount > 0 && (
            <button
              type="button"
              onClick={addLinkedEvents}
              className="btn-chunky btn-ghost text-sm py-2 px-3"
            >
              Add {untrackedLinkedCount} linked
            </button>
          )}
          <button
            type="button"
            onClick={() => addRound()}
            className="btn-chunky text-sm py-2 px-3"
          >
            <Plus size={14} /> Add round
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hairline-strong bg-surface p-4 text-sm text-muted-foreground">
          No rounds tracked yet. Add the first screen, technical round, onsite, or any custom step.
        </div>
      ) : (
        <ol className="space-y-3">
          {items.map((round, index) => (
            <li key={round.id} className="rounded-xl border border-hairline bg-surface p-3">
              <div className="grid md:grid-cols-[78px_1.4fr_150px_150px_auto] gap-2 items-start">
                <label className="block text-xs">
                  <span className="block font-semibold mb-1">#</span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={getRoundNumber(round, index + 1) ?? index + 1}
                    onChange={(e) =>
                      update(round.id, {
                        roundNumber: normalizedRoundNumber(e.target.value, index + 1),
                      })
                    }
                    className="w-full border border-hairline-strong rounded-lg px-3 py-2 bg-card text-sm"
                    aria-label="Round number"
                  />
                </label>
                <label className="block text-xs">
                  <span className="block font-semibold mb-1">Round</span>
                  <input
                    value={round.title}
                    onChange={(e) => {
                      const next = [...items];
                      next[index] = { ...round, title: e.target.value };
                      setItems(next);
                    }}
                    onBlur={() =>
                      update(round.id, {
                        title:
                          items[index]?.title.trim() ||
                          `Round ${getRoundNumber(items[index], index + 1) ?? index + 1}`,
                      })
                    }
                    className="w-full border border-hairline-strong rounded-lg px-3 py-2 bg-card text-sm"
                  />
                </label>
                <label className="block text-xs">
                  <span className="block font-semibold mb-1">Date</span>
                  <input
                    type="date"
                    value={toDateInputValue(round.scheduledAt)}
                    onChange={(e) => update(round.id, { scheduledAt: e.target.value || null })}
                    className="w-full border border-hairline-strong rounded-lg px-3 py-2 bg-card text-sm"
                  />
                </label>
                <label className="block text-xs">
                  <span className="block font-semibold mb-1">Outcome</span>
                  <select
                    value={round.outcome}
                    onChange={(e) =>
                      update(round.id, { outcome: e.target.value as InterviewRoundOutcome })
                    }
                    className="w-full border border-hairline-strong rounded-lg px-3 py-2 bg-card text-sm"
                  >
                    {INTERVIEW_ROUND_OUTCOMES.map((outcome) => (
                      <option key={outcome} value={outcome}>
                        {outcome}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => commit(items.filter((item) => item.id !== round.id))}
                  className="md:mt-6 text-muted-foreground hover:text-red-700 p-2 justify-self-start"
                  aria-label="Remove round"
                >
                  <X size={16} />
                </button>
              </div>
              <label className="block text-xs mt-2">
                <span className="block font-semibold mb-1">Public note</span>
                <input
                  value={round.publicNote ?? ""}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = { ...round, publicNote: e.target.value };
                    setItems(next);
                  }}
                  onBlur={() =>
                    update(round.id, { publicNote: items[index]?.publicNote?.trim() || null })
                  }
                  placeholder="Optional: recruiter screen done, final onsite scheduled..."
                  className="w-full border border-hairline-strong rounded-lg px-3 py-2 bg-card text-sm"
                />
              </label>
            </li>
          ))}
        </ol>
      )}

      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Public profile shows dates, round names, outcomes, and public notes. Private notes stay below.
        </p>
      )}
    </section>
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

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block font-semibold mb-1">{label}</span>
      {children}
    </label>
  );
}

function EditableHeading({
  value,
  placeholder,
  size,
  onSave,
}: {
  value: string;
  placeholder: string;
  size: "sm" | "lg";
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  // Sync prop changes (e.g. snapshot refresh).
  if (value !== local && document.activeElement?.tagName !== "INPUT") {
    setLocal(value);
  }
  const cls =
    size === "lg"
      ? "font-heading text-3xl md:text-4xl font-bold w-full bg-transparent border-0 outline-none focus:bg-card focus:px-2 focus:rounded-lg"
      : "text-muted-foreground text-lg w-full bg-transparent border-0 outline-none focus:bg-card focus:px-2 focus:rounded-lg";
  return (
    <input
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value && local.trim().length > 0) onSave(local.trim());
      }}
      className={cls}
    />
  );
}

function InlineInput({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  if (value !== local && document.activeElement?.tagName !== "INPUT") {
    setLocal(value);
  }
  return (
    <input
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onSave(local);
      }}
      className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
    />
  );
}

function DateInput({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string | null) => void;
}) {
  const [local, setLocal] = useState(toDateInputValue(value));
  const incoming = toDateInputValue(value);
  if (incoming !== local && document.activeElement?.tagName !== "INPUT") {
    setLocal(incoming);
  }
  return (
    <input
      type="date"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== incoming) onSave(local || null);
      }}
      className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
    />
  );
}

function NumberInput({
  value,
  onSave,
}: {
  value: number | null;
  onSave: (v: number | null) => void;
}) {
  const incoming = value === null ? "" : String(value);
  const [local, setLocal] = useState(incoming);
  if (incoming !== local && document.activeElement?.tagName !== "INPUT") {
    setLocal(incoming);
  }
  return (
    <input
      type="number"
      min={1}
      max={12}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local === incoming) return;
        const n = local ? Number(local) : null;
        onSave(n === null || Number.isFinite(n) ? n : value);
      }}
      className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card"
    />
  );
}

function NotesEditor({
  initial,
  placeholder,
  rows,
  onSave,
}: {
  initial: string;
  placeholder: string;
  rows: number;
  onSave: (v: string) => void;
}) {
  const [local, setLocal] = useState(initial);
  const savingHint = local !== initial;

  if (initial !== local && document.activeElement?.tagName !== "TEXTAREA") {
    setLocal(initial);
  }

  // Debounced save: flush 1.2s after typing stops.
  useEffect(() => {
    if (local === initial) return;
    const t = setTimeout(() => {
      onSave(local);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <>
      <textarea
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        rows={rows}
        className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card font-mono text-sm"
      />
      <p className="text-[0.7rem] text-muted-foreground mt-1">
        {savingHint ? "saving…" : local === initial ? "saved" : ""}
      </p>
    </>
  );
}

function ChecklistEditor({
  initial,
  onSave,
  placeholder = "Add an item...",
}: {
  initial: ChecklistItem[];
  onSave: (items: ChecklistItem[]) => void;
  placeholder?: string;
}) {
  const [items, setItems] = useState<ChecklistItem[]>(initial);
  const [draftText, setDraftText] = useState("");

  // Resync when snapshot updates externally (e.g. another tab) and we're not editing.
  if (
    items.length !== initial.length &&
    document.activeElement?.tagName !== "INPUT"
  ) {
    setItems(initial);
  }

  function update(next: ChecklistItem[]) {
    setItems(next);
    onSave(next);
  }

  function add() {
    const text = draftText.trim();
    if (!text) return;
    const id = `cl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    update([...items, { id, text, done: false }]);
    setDraftText("");
  }

  function toggle(id: string) {
    update(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function remove(id: string) {
    update(items.filter((i) => i.id !== id));
  }

  function edit(id: string, text: string) {
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, text } : i)));
  }

  function commitEdit() {
    onSave(items);
  }

  const remaining = items.filter((i) => i.done !== true).length;

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {remaining === 0
            ? `All ${items.length} done.`
            : `${remaining} of ${items.length} left.`}
        </p>
      )}
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No action items yet. Add the next concrete thing you need to do for this process.
        </p>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className={`flex items-center gap-2 border-2 border-ink rounded-xl px-3 py-2 ${
            item.done ? "bg-muted/60" : "bg-card"
          }`}
        >
          <button
            onClick={() => toggle(item.id)}
            aria-pressed={item.done}
            className={`shrink-0 h-6 w-6 rounded border-2 border-ink inline-flex items-center justify-center transition-colors ${
              item.done ? "bg-sun" : "bg-card hover:bg-muted"
            }`}
            title={item.done ? "Mark not done" : "Mark done"}
          >
            {item.done ? <Check size={14} /> : null}
          </button>
          <input
            value={item.text}
            onChange={(e) => edit(item.id, e.target.value)}
            onBlur={commitEdit}
            className={`flex-1 bg-transparent text-sm outline-none ${
              item.done ? "line-through text-muted-foreground" : ""
            }`}
          />
          <button
            onClick={() => remove(item.id)}
            className="text-muted-foreground hover:text-red-700 p-1"
            aria-label="Delete"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex items-center gap-2"
      >
        <input
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
        />
        <button
          type="submit"
          disabled={!draftText.trim()}
          className="btn-chunky text-sm py-2 px-3"
        >
          <Plus size={14} />
          Add
        </button>
      </form>
    </div>
  );
}

function CompensationEditor({
  initial,
  onSave,
}: {
  initial: Compensation;
  onSave: (c: Compensation) => void;
}) {
  const [base, setBase] = useState(initial.base ?? "");
  const [equity, setEquity] = useState(initial.equity ?? "");
  const [other, setOther] = useState(initial.other ?? "");

  // Stay in sync with snapshot updates when not actively editing.
  if (initial.base !== base && document.activeElement?.tagName !== "INPUT") {
    setBase(initial.base ?? "");
  }
  if (initial.equity !== equity && document.activeElement?.tagName !== "INPUT") {
    setEquity(initial.equity ?? "");
  }
  if (initial.other !== other && document.activeElement?.tagName !== "INPUT") {
    setOther(initial.other ?? "");
  }

  function commit() {
    if (base === initial.base && equity === initial.equity && other === initial.other) return;
    onSave({ base, equity, other });
  }

  return (
    <div className="grid sm:grid-cols-3 gap-2">
      <label className="block text-xs">
        <span className="block font-semibold mb-1">Base</span>
        <input
          value={base}
          onChange={(e) => setBase(e.target.value)}
          onBlur={commit}
          placeholder="$180k–$220k"
          className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="block font-semibold mb-1">Equity</span>
        <input
          value={equity}
          onChange={(e) => setEquity(e.target.value)}
          onBlur={commit}
          placeholder="0.1% / $200k RSUs 4yr"
          className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="block font-semibold mb-1">Other</span>
        <input
          value={other}
          onChange={(e) => setOther(e.target.value)}
          onBlur={commit}
          placeholder="10% bonus, relo, signing"
          className="w-full border-2 border-ink rounded-xl px-3 py-2 bg-card text-sm"
        />
      </label>
    </div>
  );
}

function ContactsEditor({
  initial,
  onSave,
}: {
  initial: Contact[];
  onSave: (v: Contact[]) => void;
}) {
  const [list, setList] = useState<Contact[]>(initial);
  if (initial.length !== list.length) {
    // Trust snapshot when length changes (add/remove server-side)
    setList(initial);
  }

  function update(next: Contact[]) {
    setList(next);
    onSave(next);
  }

  return (
    <div className="space-y-2">
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Recruiters, hiring managers, referrers — anyone you want to remember.
        </p>
      )}
      {list.map((c, i) => (
        <div key={i} className="grid sm:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-start">
          <input
            value={c.name}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...c, name: e.target.value };
              setList(next);
            }}
            onBlur={() => onSave(list)}
            placeholder="Name"
            className="border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
          <input
            value={c.role}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...c, role: e.target.value };
              setList(next);
            }}
            onBlur={() => onSave(list)}
            placeholder="Role (recruiter, HM, ...)"
            className="border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
          <input
            value={c.note}
            onChange={(e) => {
              const next = [...list];
              next[i] = { ...c, note: e.target.value };
              setList(next);
            }}
            onBlur={() => onSave(list)}
            placeholder="Note (email, last touch, etc)"
            className="border-2 border-ink rounded-xl px-3 py-2 bg-card"
          />
          <button
            onClick={() => update(list.filter((_, j) => j !== i))}
            className="text-muted-foreground hover:text-red-700 p-2"
            aria-label="Remove contact"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        onClick={() => update([...list, { name: "", role: "", note: "" }])}
        className="btn-chunky btn-ghost text-sm"
      >
        <Plus size={14} /> Add contact
      </button>
    </div>
  );
}
