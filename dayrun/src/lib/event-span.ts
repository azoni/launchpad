import type { EventDoc } from "./firebase/collections";

/** Pure-display augmentation for multi-day events. Same underlying event, repeated
 *  once per day in its span, with `_spanIdx` (0-based) and `_spanTotal` set. */
export type DisplayEvent = EventDoc & {
  _spanDay?: Date;
  _spanIdx?: number;
  _spanTotal?: number;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const DAY_MS = 86_400_000;

/** Expand events that span multiple days into one DisplayEvent per day.
 *  Cap span to MAX_SPAN_DAYS so a misformed "always-on" event doesn't generate 365 rows. */
const MAX_SPAN_DAYS = 30;

export function expandSpans(events: EventDoc[]): DisplayEvent[] {
  const out: DisplayEvent[] = [];
  for (const ev of events) {
    if (!ev.start) {
      out.push(ev);
      continue;
    }
    const startDate = new Date(ev.start);
    const endRaw = ev.end ? new Date(ev.end) : null;

    let lastInclusiveDay: Date;
    if (ev.allDay) {
      // Google all-day end is exclusive (start of day-after-last). Subtract one day.
      if (!endRaw) {
        lastInclusiveDay = startOfDay(startDate);
      } else {
        lastInclusiveDay = startOfDay(new Date(endRaw.getTime() - 1)); // 1ms inside last day
      }
    } else {
      // Timed event: the last day touched is the calendar date of `end`.
      // If end is exactly midnight (boundary), back it off by 1ms so we don't include the next day.
      if (!endRaw) {
        lastInclusiveDay = startOfDay(startDate);
      } else {
        const adj = new Date(endRaw.getTime() - 1);
        lastInclusiveDay = startOfDay(adj);
      }
    }
    const firstDay = startOfDay(startDate);
    let totalDays = Math.round(
      (lastInclusiveDay.getTime() - firstDay.getTime()) / DAY_MS,
    ) + 1;
    if (totalDays < 1) totalDays = 1;
    if (totalDays === 1) {
      out.push(ev);
      continue;
    }
    const days = Math.min(totalDays, MAX_SPAN_DAYS);
    for (let i = 0; i < days; i++) {
      const day = new Date(firstDay.getTime() + i * DAY_MS);
      out.push({
        ...ev,
        _spanDay: day,
        _spanIdx: i,
        _spanTotal: totalDays,
      });
    }
  }
  return out;
}

export function spanLabel(idx: number, total: number): string {
  return `Day ${idx + 1} of ${total}`;
}
