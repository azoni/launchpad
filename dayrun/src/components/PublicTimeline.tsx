import type { EventDoc, OpportunityDoc } from "@/lib/firebase/collections";
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

function relativeLabel(d: Date, today: Date): string {
  return relativeCalendarDayLabel(d, today);
}

function shortDateLabel(d: Date) {
  return formatCalendarDayDate(d, { month: "short", day: "numeric" });
}

function timeOf(ev: DisplayEvent): string {
  if (ev._spanIdx !== undefined && ev._spanIdx > 0) return "-";
  return formatCalendarTime(ev);
}

type Bucket = { date: Date; key: string; items: DisplayEvent[] };

function bucketByDay(events: DisplayEvent[]): Bucket[] {
  const groups = new Map<string, Bucket>();
  for (const ev of events) {
    const d = ev._spanDay ?? startOfDay(calendarDayDate(ev.start));
    const key = dayKey(d);
    if (!groups.has(key)) groups.set(key, { date: d, key, items: [] });
    groups.get(key)!.items.push(ev);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

const NEGATIVE_CLOSED = ["rejected", "withdrew", "ghosted"] as const;

export function PublicTimeline({
  events,
  opportunitiesById,
  emptyState,
}: {
  events: EventDoc[];
  opportunitiesById?: Map<string, OpportunityDoc>;
  emptyState?: React.ReactNode;
}) {
  if (events.length === 0) {
    return <div className="text-[15px] text-[color:var(--faded)] italic">{emptyState}</div>;
  }

  const today = todayInTimeZone();
  const todayKey = dayKey(today);
  const now = Date.now();

  const display = expandSpans(events);
  const buckets = bucketByDay(display);
  const past = buckets.filter((b) => b.key < todayKey).reverse();
  const todayBucket = buckets.find((b) => b.key === todayKey);
  const upcoming = buckets.filter((b) => b.key > todayKey);

  const ordered: Bucket[] = [];
  if (todayBucket) ordered.push(todayBucket);
  ordered.push(...upcoming);
  ordered.push(...past);

  return (
    <ol className="space-y-8">
      {ordered.map((b) => (
        <li key={b.key}>
          <DayHeader date={b.date} today={today} />
          <ul className="mt-3 divide-y divide-[color:var(--hairline)]">
            {b.items.map((ev) => (
              <EventRow
                key={`${ev.googleEventId}_${ev._spanIdx ?? 0}`}
                event={ev}
                opportunitiesById={opportunitiesById}
                now={now}
              />
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function DayHeader({ date, today }: { date: Date; today: Date }) {
  const rel = relativeLabel(date, today);
  const isToday = rel === "Today";
  return (
    <header className="flex items-baseline gap-3">
      <h3
        className="text-[15px] font-medium"
        style={{
          fontFamily: "var(--font-heading)",
          color: isToday ? "var(--ink)" : "var(--ink-soft)",
        }}
      >
        {rel}
        <span className="text-[color:var(--faded)]"> - {shortDateLabel(date)}</span>
      </h3>
      <span className="flex-1 h-px bg-[color:var(--hairline)] translate-y-[2px]" />
    </header>
  );
}

function EventRow({
  event,
  opportunitiesById,
  now,
}: {
  event: DisplayEvent;
  opportunitiesById?: Map<string, OpportunityDoc>;
  now: number;
}) {
  const opp = event.opportunityId
    ? (opportunitiesById?.get(event.opportunityId) ?? null)
    : null;
  const closedNegative = opp && (NEGATIVE_CLOSED as readonly string[]).includes(opp.status);
  const endRaw = event.end || event.start;
  const isPast = endRaw ? new Date(endRaw).getTime() < now : false;
  const struck = isPast || closedNegative;
  const isSpan = event._spanTotal !== undefined && event._spanTotal > 1;

  return (
    <li className="grid grid-cols-[72px_1fr] sm:grid-cols-[88px_1fr] gap-4 py-3">
      <div className="pt-0.5">
        <span
          className="dy-mono"
          style={{ color: isPast ? "var(--faded)" : "var(--ink-soft)" }}
        >
          {timeOf(event)}
        </span>
      </div>
      <div className="min-w-0">
        <p
          className={`text-[15px] leading-snug ${
            struck ? "line-through text-[color:var(--faded)]" : "text-[color:var(--ink)]"
          }`}
        >
          {event.summary}
          {isSpan && (
            <span
              className="ml-2 text-[11px] uppercase tracking-[0.08em] align-middle"
              style={{ color: "var(--faded)" }}
            >
              {spanLabel(event._spanIdx ?? 0, event._spanTotal ?? 1)}
            </span>
          )}
        </p>
        <div className="mt-1 flex items-center gap-2 flex-wrap text-[13px] text-[color:var(--ink-soft)]">
          {opp && <OpportunityChip opp={opp} />}
          {event.location && (
            <span className="truncate max-w-full text-[color:var(--faded)]">
              {opp && " - "}
              {event.location}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function OpportunityChip({ opp }: { opp: OpportunityDoc }) {
  const isPos = opp.status === "offer" || opp.status === "accepted";
  const isNeg = opp.status === "rejected";
  let dotColor = "var(--primary)";
  if (isPos) dotColor = "var(--positive)";
  else if (isNeg) dotColor = "var(--negative)";
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[color:var(--ink-soft)]">
      <span
        aria-hidden
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: dotColor }}
      />
      {opp.company}
    </span>
  );
}
