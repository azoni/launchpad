"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import type { EventDoc } from "@/lib/firebase/collections";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(d: Date, today: Date) {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function timeLabel(ev: EventDoc) {
  if (ev.allDay) return "All day";
  return new Date(ev.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

type DayBucket = { date: Date; key: string; items: EventDoc[] };

function bucketByDay(events: EventDoc[]): DayBucket[] {
  const groups = new Map<string, DayBucket>();
  for (const ev of events) {
    const d = startOfDay(new Date(ev.start));
    const key = dayKey(d);
    if (!groups.has(key)) groups.set(key, { date: d, key, items: [] });
    groups.get(key)!.items.push(ev);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export type TimelineActions = {
  toggleOne: (id: string, next: boolean) => Promise<void>;
  toggleMany: (ids: string[], next: boolean) => Promise<void>;
};

export function TimelineView({
  events,
  editable,
  actions,
  emptyState,
}: {
  events: EventDoc[];
  editable?: boolean;
  actions?: TimelineActions;
  emptyState?: React.ReactNode;
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = dayKey(today);
  const [showPast, setShowPast] = useState(false);

  const buckets = useMemo(() => bucketByDay(events), [events]);
  const past = buckets.filter((b) => b.key < todayKey);
  const todayBucket = buckets.find((b) => b.key === todayKey);
  const upcoming = buckets.filter((b) => b.key > todayKey);

  if (events.length === 0) {
    return <div className="chunky p-8 text-center">{emptyState ?? "No events yet."}</div>;
  }

  return (
    <div className="space-y-8">
      {/* TODAY */}
      <Section
        label="Today"
        sublabel={today.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
        accent="primary"
      >
        {todayBucket ? (
          <DayCard
            bucket={todayBucket}
            today={today}
            editable={editable}
            actions={actions}
            highlight
          />
        ) : (
          <div className="chunky chunky-coral p-6 text-center">
            <p className="font-heading text-2xl">Nothing on the books today. Enjoy it. ☕</p>
          </div>
        )}
      </Section>

      {/* UPCOMING */}
      {upcoming.length > 0 && (
        <Section
          label="Upcoming"
          sublabel={`${upcoming.reduce((n, b) => n + b.items.length, 0)} events`}
          accent="grape"
        >
          <div className="space-y-4">
            {upcoming.map((b) => (
              <DayCard key={b.key} bucket={b} today={today} editable={editable} actions={actions} />
            ))}
          </div>
        </Section>
      )}

      {/* PAST */}
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
                <DayCard
                  key={b.key}
                  bucket={b}
                  today={today}
                  editable={editable}
                  actions={actions}
                  past
                />
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

function DayCard({
  bucket,
  today,
  editable,
  actions,
  highlight,
  past,
}: {
  bucket: DayBucket;
  today: Date;
  editable?: boolean;
  actions?: TimelineActions;
  highlight?: boolean;
  past?: boolean;
}) {
  const ids = bucket.items.map((e) => e.googleEventId);
  const allPublic = bucket.items.every((e) => e.isPublic);
  const cls = highlight ? "chunky chunky-coral p-4 md:p-5" : "chunky p-4 md:p-5";
  return (
    <div className={cls + (past ? " opacity-90" : "")}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h3 className="font-heading text-xl md:text-2xl font-bold">
          {dayLabel(bucket.date, today)}
          {dayLabel(bucket.date, today) !== bucket.date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" }) && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              · {bucket.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </span>
          )}
        </h3>
        {editable && actions && (
          <button
            onClick={() => actions.toggleMany(ids, !allPublic)}
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
          <EventRow
            key={ev.googleEventId}
            event={ev}
            editable={editable}
            onToggle={(n) => actions?.toggleOne(ev.googleEventId, n)}
          />
        ))}
      </div>
    </div>
  );
}

function EventRow({
  event,
  editable,
  onToggle,
}: {
  event: EventDoc;
  editable?: boolean;
  onToggle?: (next: boolean) => Promise<void> | void;
}) {
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState(event.isPublic);

  // Keep in sync if the underlying prop changes (e.g. bulk toggle from parent).
  if (event.isPublic !== optimistic && !pending) {
    setOptimistic(event.isPublic);
  }

  async function flip() {
    if (!editable || !onToggle || pending) return;
    setPending(true);
    const next = !optimistic;
    setOptimistic(next);
    try {
      await onToggle(next);
    } catch {
      setOptimistic(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={`flex items-start gap-3 border-2 border-ink rounded-xl p-3 transition-colors ${
        optimistic ? "bg-sun/40" : "bg-card"
      }`}
    >
      <span
        className={`shrink-0 px-2 py-1 text-xs rounded-md font-bold border-2 border-ink ${
          optimistic ? "bg-primary text-white" : "bg-muted text-ink"
        }`}
      >
        {timeLabel(event)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{event.summary}</p>
        {event.location && (
          <p className="text-xs text-muted-foreground truncate">📍 {event.location}</p>
        )}
      </div>
      {editable ? (
        <button
          onClick={flip}
          disabled={pending}
          aria-pressed={optimistic}
          className={`sticker shrink-0 transition-all ${
            optimistic ? "bg-sun" : "bg-card text-muted-foreground hover:bg-muted"
          }`}
          title={optimistic ? "Hide from public profile" : "Show on public profile"}
        >
          {optimistic ? <Eye size={12} /> : <EyeOff size={12} />}
          {optimistic ? "public" : "private"}
        </button>
      ) : (
        optimistic && (
          <span className="sticker shrink-0">
            <Eye size={12} /> public
          </span>
        )
      )}
    </div>
  );
}
