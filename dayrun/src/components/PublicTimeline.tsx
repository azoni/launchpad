import type { EventDoc, OpportunityDoc } from "@/lib/firebase/collections";
import { expandSpans, spanLabel, type DisplayEvent } from "@/lib/event-span";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function relativeDayLabel(d: Date, today: Date): string {
  const diff = Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long" });
}

function dayDateLabel(d: Date) {
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function timeOf(ev: DisplayEvent): string {
  if (ev.allDay) return "all day";
  // For multi-day timed events, only the first day shows the time; subsequent days say "continued".
  if (ev._spanIdx !== undefined && ev._spanIdx > 0) return "continued";
  return new Date(ev.start).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

type Bucket = { date: Date; key: string; items: DisplayEvent[] };

function bucketByDay(events: DisplayEvent[]): Bucket[] {
  const groups = new Map<string, Bucket>();
  for (const ev of events) {
    const d = ev._spanDay ?? startOfDay(new Date(ev.start));
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
    return (
      <div className="text-[15px] text-[color:var(--ed-muted)]">
        {emptyState ?? "Nothing on the calendar."}
      </div>
    );
  }

  const today = new Date();
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
    <ol className="space-y-10">
      {ordered.map((b) => (
        <li key={b.key}>
          <DayHeader date={b.date} today={today} />
          <ul className="mt-3 divide-y divide-[color:var(--ed-hairline)]">
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
  const rel = relativeDayLabel(date, today);
  const isToday = rel === "Today";
  return (
    <header className="flex items-baseline gap-3">
      <h3
        className="text-[15px] font-medium"
        style={{ fontFamily: "var(--font-editorial)" }}
      >
        <span className={isToday ? "text-[color:var(--ed-ink)]" : "text-[color:var(--ed-ink-soft)]"}>
          {rel}
        </span>
        <span className="text-[color:var(--ed-mutest)]"> · {dayDateLabel(date)}</span>
      </h3>
      <span className="flex-1 h-px bg-[color:var(--ed-hairline)] translate-y-1" />
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
    <li className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] gap-4 py-3">
      <div className="pt-0.5">
        <span
          className={`ed-mono ${
            isPast ? "text-[color:var(--ed-mutest)]" : "text-[color:var(--ed-ink-soft)]"
          }`}
        >
          {timeOf(event)}
        </span>
      </div>
      <div className="min-w-0">
        <p
          className={`text-[15px] leading-snug ${
            struck
              ? "line-through text-[color:var(--ed-mutest)]"
              : "text-[color:var(--ed-ink)]"
          }`}
        >
          {event.summary}
          {isSpan && (
            <span className="ml-2 text-[12px] text-[color:var(--ed-mutest)] font-medium align-middle">
              {spanLabel(event._spanIdx ?? 0, event._spanTotal ?? 1)}
            </span>
          )}
        </p>
        <div className="mt-1 flex items-center gap-2 flex-wrap text-[13px] text-[color:var(--ed-muted)]">
          {opp && <OpportunityChip opp={opp} />}
          {event.location && (
            <span className="truncate max-w-full">
              <span className="ed-dot">·</span> {event.location}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

function OpportunityChip({ opp }: { opp: OpportunityDoc }) {
  const isOffer = opp.status === "offer" || opp.status === "accepted";
  const isRejected = opp.status === "rejected";
  let className = "ed-pill ed-pill-neutral";
  let dotColor = "var(--ed-mutest)";
  if (isOffer) {
    className = "ed-pill ed-pill-positive";
    dotColor = "var(--ed-positive)";
  } else if (isRejected) {
    className = "ed-pill ed-pill-negative";
    dotColor = "var(--ed-negative)";
  }
  return (
    <span className={className}>
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: dotColor }}
      />
      {opp.company}
    </span>
  );
}
