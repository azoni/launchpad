"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Eye,
  EyeOff,
  MinusCircle,
  XCircle,
} from "lucide-react";
import type {
  EventDoc,
  EventNotesDoc,
  OpportunityDoc,
  OpportunityStatus,
  RoundOutcome,
} from "@/lib/firebase/collections";
import { ROUND_OUTCOMES } from "@/lib/firebase/collections";
import { expandSpans, spanLabel, type DisplayEvent } from "@/lib/event-span";
import {
  calendarDayDate,
  formatCalendarDayDate,
  formatCalendarTime,
  relativeCalendarDayLabel,
  todayInTimeZone,
} from "@/lib/calendar-time";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(d: Date, today: Date) {
  return relativeCalendarDayLabel(d, today);
}

function timeLabel(ev: DisplayEvent) {
  if (ev._spanIdx !== undefined && ev._spanIdx > 0) return "continued";
  return formatCalendarTime(ev);
}

const CLOSED_STATUSES: OpportunityStatus[] = ["accepted", "rejected", "withdrew", "ghosted"];
const NEGATIVE_CLOSED: OpportunityStatus[] = ["rejected", "withdrew", "ghosted"];

type DayBucket = { date: Date; key: string; items: DisplayEvent[] };

function bucketByDay(events: DisplayEvent[]): DayBucket[] {
  const groups = new Map<string, DayBucket>();
  for (const ev of events) {
    const d = ev._spanDay ?? startOfDay(calendarDayDate(ev.start));
    const key = dayKey(d);
    if (!groups.has(key)) groups.set(key, { date: d, key, items: [] });
    groups.get(key)!.items.push(ev);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export type TimelineActions = {
  toggleOne: (id: string, next: boolean) => Promise<void>;
  toggleMany: (ids: string[], next: boolean) => Promise<void>;
  createPipelineFromEvent?: (event: EventDoc) => Promise<void>;
  saveEventNotes?: (
    eventId: string,
    update: Partial<EventNotesDoc>,
  ) => Promise<void>;
};

export function TimelineView({
  events,
  editable,
  actions,
  emptyState,
  opportunitiesById,
  eventNotesById,
  ownerView,
  pastDefaultOpen,
}: {
  events: EventDoc[];
  editable?: boolean;
  actions?: TimelineActions;
  emptyState?: React.ReactNode;
  opportunitiesById?: Map<string, OpportunityDoc>;
  eventNotesById?: Map<string, EventNotesDoc>;
  ownerView?: boolean;
  pastDefaultOpen?: boolean;
}) {
  const today = useMemo(() => todayInTimeZone(), []);
  const todayKey = dayKey(today);
  const [showPast, setShowPast] = useState(!!pastDefaultOpen);

  const buckets = useMemo(() => bucketByDay(expandSpans(events)), [events]);
  const past = buckets.filter((b) => b.key < todayKey);
  const todayBucket = buckets.find((b) => b.key === todayKey);
  const upcoming = buckets.filter((b) => b.key > todayKey);

  if (events.length === 0) {
    return <div className="chunky p-8 text-center">{emptyState ?? "No events yet."}</div>;
  }

  const sharedProps = { opportunitiesById, eventNotesById, ownerView, editable, actions };

  return (
    <div className="space-y-5 md:space-y-8">
      <Section
        label="Today"
        sublabel={formatCalendarDayDate(today, { weekday: "long", month: "short", day: "numeric" })}
        accent="primary"
      >
        {todayBucket ? (
          <DayCard bucket={todayBucket} today={today} highlight {...sharedProps} />
        ) : (
          <div className="chunky chunky-coral p-6 text-center">
            <p className="font-heading text-2xl">Nothing on the books today. Enjoy it. ☕</p>
          </div>
        )}
      </Section>

      {upcoming.length > 0 && (
        <Section
          label="Upcoming"
          sublabel={`${upcoming.reduce((n, b) => n + b.items.length, 0)} events`}
          accent="grape"
        >
          <div className="space-y-4">
            {upcoming.map((b) => (
              <DayCard key={b.key} bucket={b} today={today} {...sharedProps} />
            ))}
          </div>
        </Section>
      )}

      {past.length > 0 && (
        <Section label="Past" sublabel={`${past.reduce((n, b) => n + b.items.length, 0)} events`} accent="sun">
          <button
            onClick={() => setShowPast((s) => !s)}
            className="btn-chunky btn-ghost w-full justify-center mb-3"
          >
            <ChevronDown
              size={18}
              className={`transition-transform ${showPast ? "rotate-180" : ""}`}
            />
            {showPast ? "Hide past events" : `Show ${past.reduce((n, b) => n + b.items.length, 0)} past events`}
          </button>
          {showPast && (
            <div className="space-y-4">
              {[...past].reverse().map((b) => (
                <DayCard key={b.key} bucket={b} today={today} past {...sharedProps} />
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({
  label,
  sublabel,
  accent,
  children,
}: {
  label: string;
  sublabel?: string;
  accent: "primary" | "grape" | "sun";
  children: React.ReactNode;
}) {
  const dot =
    accent === "primary" ? "bg-primary" : accent === "grape" ? "bg-grape" : "bg-sun";
  return (
    <section>
      <header className="flex items-baseline gap-3 mb-3">
        <span className={`inline-block h-3 w-3 rounded-full border-2 border-ink ${dot}`} />
        <h2 className="font-heading text-2xl md:text-3xl font-bold">{label}</h2>
        {sublabel && (
          <span className="text-sm text-muted-foreground font-mono">{sublabel}</span>
        )}
      </header>
      {children}
    </section>
  );
}

type RowSharedProps = {
  opportunitiesById?: Map<string, OpportunityDoc>;
  eventNotesById?: Map<string, EventNotesDoc>;
  ownerView?: boolean;
  editable?: boolean;
  actions?: TimelineActions;
};

function DayCard({
  bucket,
  today,
  highlight,
  past,
  ...rest
}: {
  bucket: DayBucket;
  today: Date;
  highlight?: boolean;
  past?: boolean;
} & RowSharedProps) {
  const ids = bucket.items.map((e) => e.googleEventId);
  const allPublic = bucket.items.every((e) => e.isPublic);
  const cls = highlight ? "chunky chunky-coral p-3 md:p-5" : "chunky p-3 md:p-5";
  return (
    <div className={cls + (past ? " opacity-90" : "")}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="font-heading text-xl md:text-2xl font-bold">
          {dayLabel(bucket.date, today)}
          {dayLabel(bucket.date, today) !==
            bucket.date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }) && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ·{" "}
              {bucket.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </span>
          )}
        </h3>
        {rest.editable && rest.actions && (
          <button
            onClick={() => rest.actions!.toggleMany(ids, !allPublic)}
            className="text-xs sticker bg-card hover:bg-sun transition-colors"
            title={allPublic ? "Hide whole day from public profile" : "Show whole day on public profile"}
          >
            {allPublic ? <EyeOff size={12} /> : <Eye size={12} />}
            {allPublic ? "all public · unshare" : "share whole day"}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {bucket.items.map((ev) => (
          <EventRow key={`${ev.googleEventId}_${ev._spanIdx ?? 0}`} event={ev} {...rest} />
        ))}
      </div>
    </div>
  );
}

function OpportunityChip({
  opp,
  ownerView,
}: {
  opp: OpportunityDoc;
  ownerView?: boolean;
}) {
  const isOffer = opp.status === "offer" || opp.status === "accepted";
  const isNegativeClosed = NEGATIVE_CLOSED.includes(opp.status);
  const bg = isOffer
    ? "bg-sun text-ink"
    : isNegativeClosed
      ? "bg-card text-muted-foreground"
      : "bg-grape text-white";
  const inner = (
    <span
      className={`inline-flex items-center gap-1 text-[0.7rem] font-bold px-2 py-0.5 rounded-full border-2 border-ink ${bg}`}
    >
      {isOffer ? "🎉" : <Briefcase size={11} />}
      {opp.company}
      <span className="opacity-70">· {opp.status}</span>
    </span>
  );
  if (ownerView) {
    return (
      <Link
        href={`/app/pipeline/${opp.id}`}
        className="hover:no-underline"
        onClick={(e) => e.stopPropagation()}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

const OUTCOME_META: Record<
  RoundOutcome,
  { label: string; bg: string; fg: string; icon: React.ReactNode }
> = {
  pending: { label: "pending", bg: "#FAEBD8", fg: "#0E1B2C", icon: <Circle size={11} /> },
  passed: { label: "passed", bg: "#3DDC97", fg: "#0E1B2C", icon: <Check size={11} /> },
  failed: { label: "didn't pass", bg: "#FAEBD8", fg: "#6B5B47", icon: <XCircle size={11} /> },
  "no-show": { label: "no-show", bg: "#FAEBD8", fg: "#6B5B47", icon: <MinusCircle size={11} /> },
};

function OutcomePip({ outcome }: { outcome: RoundOutcome }) {
  const m = OUTCOME_META[outcome];
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.7rem] font-bold px-2 py-0.5 rounded-full border-2 border-ink"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function PublicToggle({
  isPublic,
  pending,
  onClick,
  inheritedFrom,
}: {
  isPublic: boolean;
  pending: boolean;
  onClick: () => void;
  /** company name if visibility is inherited from a public pipeline item */
  inheritedFrom: string | null;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-pressed={isPublic}
      title={
        inheritedFrom
          ? `Public via pipeline (${inheritedFrom}). Click to override.`
          : isPublic
            ? "Hide from public profile"
            : "Show on public profile"
      }
      className={`shrink-0 min-h-[36px] min-w-[80px] inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border-2 border-ink text-xs font-bold transition-all ${
        isPublic
          ? "bg-sun text-ink hover:bg-[#FFC54A]"
          : "bg-card text-muted-foreground hover:bg-muted"
      }`}
    >
      {isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
      {isPublic ? "public" : "private"}
    </button>
  );
}

function EventRow({
  event,
  editable,
  actions,
  opportunitiesById,
  eventNotesById,
  ownerView,
}: {
  event: DisplayEvent;
} & RowSharedProps) {
  const [pendingPublic, setPendingPublic] = useState(false);
  const [creatingPipeline, setCreatingPipeline] = useState(false);
  const [optimisticPublic, setOptimisticPublic] = useState(event.isPublic);
  const [expanded, setExpanded] = useState(false);

  if (event.isPublic !== optimisticPublic && !pendingPublic) {
    setOptimisticPublic(event.isPublic);
  }

  const opp = event.opportunityId
    ? (opportunitiesById?.get(event.opportunityId) ?? null)
    : null;
  const notes = eventNotesById?.get(event.googleEventId);
  const closedNegative = opp && NEGATIVE_CLOSED.includes(opp.status);

  // An event is "in the past" once its end time is before now. For all-day events,
  // event.end is the exclusive next-day date — strict less-than still works.
  const endTime = event.end || event.start;
  const isPast = endTime ? new Date(endTime).getTime() < Date.now() : false;
  const struck = !!(closedNegative || isPast);

  async function flipPublic() {
    if (!editable || !actions || pendingPublic) return;
    setPendingPublic(true);
    const next = !optimisticPublic;
    setOptimisticPublic(next);
    try {
      await actions.toggleOne(event.googleEventId, next);
    } catch {
      setOptimisticPublic(!next);
    } finally {
      setPendingPublic(false);
    }
  }

  async function createPipeline() {
    if (!editable || !actions?.createPipelineFromEvent || creatingPipeline || opp) return;
    setCreatingPipeline(true);
    try {
      await actions.createPipelineFromEvent(event);
    } finally {
      setCreatingPipeline(false);
    }
  }

  const rowBg =
    closedNegative
      ? "bg-card opacity-70"
      : optimisticPublic
        ? "bg-sun/40"
        : isPast
          ? "bg-card opacity-80"
          : "bg-card";

  return (
    <div className={`border-2 border-ink rounded-xl p-2.5 sm:p-3 transition-colors ${rowBg}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <span
          className={`shrink-0 px-2 py-1 text-[0.7rem] sm:text-xs rounded-md font-bold border-2 border-ink ${
            isPast
              ? "bg-muted text-muted-foreground"
              : optimisticPublic
                ? "bg-primary text-white"
                : "bg-muted text-ink"
          }`}
        >
          {timeLabel(event)}
        </span>
        <div className="flex-1 min-w-0">
          {ownerView && opp ? (
            <Link
              href={`/app/pipeline/${opp.id}`}
              className={`font-semibold break-words hover:text-primary hover:no-underline ${
                struck ? "line-through text-muted-foreground" : ""
              }`}
              title={`Open ${opp.company} pipeline item`}
            >
              {event.summary}
              {event._spanTotal !== undefined && event._spanTotal > 1 && (
                <span className="ml-2 text-[0.7rem] font-medium text-muted-foreground align-middle">
                  {spanLabel(event._spanIdx ?? 0, event._spanTotal)}
                </span>
              )}
            </Link>
          ) : (
            <p
              className={`font-semibold break-words ${
                struck ? "line-through text-muted-foreground" : ""
              }`}
              title={event.summary}
            >
              {event.summary}
              {event._spanTotal !== undefined && event._spanTotal > 1 && (
                <span className="ml-2 text-[0.7rem] font-medium text-muted-foreground align-middle">
                  {spanLabel(event._spanIdx ?? 0, event._spanTotal)}
                </span>
              )}
            </p>
          )}
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            {event.location && (
              <p className="text-xs text-muted-foreground truncate max-w-full">
                📍 {event.location}
              </p>
            )}
            {opp && <OpportunityChip opp={opp} ownerView={ownerView} />}
            {ownerView && notes?.roundName && (
              <span className="text-[0.7rem] font-semibold text-muted-foreground border-2 border-dashed border-muted-foreground/40 rounded-full px-2">
                {notes.roundName}
              </span>
            )}
            {ownerView && notes && notes.outcome && notes.outcome !== "pending" && (
              <OutcomePip outcome={notes.outcome} />
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 shrink-0 flex-wrap">
          {editable && ownerView && !opp && actions?.createPipelineFromEvent && (
            <button
              onClick={createPipeline}
              disabled={creatingPipeline}
              className="min-h-[36px] inline-flex items-center justify-center gap-1 rounded-full border-2 border-ink bg-grape px-3 py-1.5 text-xs font-bold text-white transition-all hover:brightness-105 disabled:opacity-60"
              title="Create a pipeline item from this calendar event"
            >
              <Briefcase size={13} />
              {creatingPipeline ? "adding..." : "pipeline"}
            </button>
          )}
          {editable && actions?.saveEventNotes && opp && (
            <button
              onClick={() => setExpanded((s) => !s)}
              className={`min-h-[36px] min-w-[36px] p-1.5 rounded-full border-2 border-ink inline-flex items-center justify-center ${
                expanded ? "bg-grape text-white" : "bg-card hover:bg-muted"
              }`}
              title="Round notes"
              aria-label="Round notes"
            >
              <ChevronRight
                size={14}
                className={`transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </button>
          )}
          {editable ? (
            <PublicToggle
              isPublic={optimisticPublic}
              pending={pendingPublic}
              onClick={flipPublic}
              inheritedFrom={opp && opp.isPublic && optimisticPublic ? opp.company : null}
            />
          ) : (
            optimisticPublic && (
              <span className="sticker shrink-0">
                <Eye size={12} /> public
              </span>
            )
          )}
        </div>
      </div>

      {expanded && editable && actions?.saveEventNotes && (
        <RoundEditor
          eventId={event.googleEventId}
          initial={notes ?? { roundName: null, outcome: "pending", notes: "", updatedAt: 0 }}
          onSave={(update) => actions.saveEventNotes!(event.googleEventId, update)}
        />
      )}
    </div>
  );
}

function RoundEditor({
  initial,
  onSave,
}: {
  eventId: string;
  initial: EventNotesDoc;
  onSave: (update: Partial<EventNotesDoc>) => Promise<void>;
}) {
  const [roundName, setRoundName] = useState(initial.roundName ?? "");
  const [outcome, setOutcome] = useState<RoundOutcome>(initial.outcome ?? "pending");
  const [notesText, setNotesText] = useState(initial.notes ?? "");
  const [saving, setSaving] = useState<string | null>(null);

  async function commit(update: Partial<EventNotesDoc>, key: string) {
    setSaving(key);
    try {
      await onSave(update);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t-2 border-dashed border-ink/20 space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <label className="block text-xs">
          <span className="block font-semibold mb-1">Round name</span>
          <input
            value={roundName}
            onChange={(e) => setRoundName(e.target.value)}
            onBlur={() =>
              roundName !== (initial.roundName ?? "") &&
              commit({ roundName: roundName.trim() || null }, "roundName")
            }
            placeholder="Phone screen / System design / Behavioral"
            className="w-full border-2 border-ink rounded-lg px-2 py-1.5 bg-card text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="block font-semibold mb-1">Outcome</span>
          <select
            value={outcome}
            onChange={(e) => {
              const v = e.target.value as RoundOutcome;
              setOutcome(v);
              commit({ outcome: v }, "outcome");
            }}
            className="w-full border-2 border-ink rounded-lg px-2 py-1.5 bg-card text-sm"
          >
            {ROUND_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-xs">
        <span className="block font-semibold mb-1">Private notes for this round</span>
        <textarea
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          onBlur={() =>
            notesText !== (initial.notes ?? "") && commit({ notes: notesText }, "notes")
          }
          rows={3}
          placeholder="What happened, how it went, anything to remember"
          className="w-full border-2 border-ink rounded-lg px-2 py-1.5 bg-card text-sm font-mono"
        />
      </label>
      {saving && <p className="text-[0.7rem] text-muted-foreground">saving {saving}…</p>}
    </div>
  );
}
