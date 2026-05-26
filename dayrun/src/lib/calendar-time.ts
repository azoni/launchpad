export const DEFAULT_TIME_ZONE =
  process.env.NEXT_PUBLIC_DEFAULT_TIME_ZONE || "America/Los_Angeles";

const DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/;
const HAS_OFFSET_RE = /[+-]\d{2}:?\d{2}$/;
const ZULU_RE = /Z$/i;

type CalendarParts = {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null;
};

export type CalendarTimeLike = {
  start: string;
  allDay?: boolean;
  timeZone?: string | null;
};

export function calendarParts(value?: string | null): CalendarParts | null {
  if (!value) return null;
  const match = DATE_TIME_RE.exec(value);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] === undefined ? null : Number(match[4]),
    minute: match[5] === undefined ? null : Number(match[5]),
  };
}

export function calendarDayDate(value?: string | null): Date {
  const parts = calendarParts(value);
  if (!parts) return new Date(value ?? Date.now());
  return new Date(parts.year, parts.month - 1, parts.day);
}

export function calendarDayKey(value?: string | null): string {
  const parts = calendarParts(value);
  if (!parts) return keyFromDate(new Date(value ?? Date.now()));
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function keyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function todayInTimeZone(timeZone = DEFAULT_TIME_ZONE): Date {
  const key = dateKeyInTimeZone(new Date(), timeZone);
  return calendarDayDate(key);
}

export function formatCalendarDay(
  value?: string | null,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  const date = calendarDayDate(value);
  return date.toLocaleDateString([], options);
}

export function formatCalendarDayDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
) {
  return date.toLocaleDateString([], options);
}

export function formatCalendarTime(event: CalendarTimeLike): string {
  if (event.allDay) return "all day";
  const parts = calendarParts(event.start);
  const isZulu = ZULU_RE.test(event.start);
  const hasOffset = HAS_OFFSET_RE.test(event.start);

  // Google dateTime values normally include the calendar-local wall time plus
  // an offset. Use that wall time directly so server rendering cannot shift it.
  if (parts && parts.hour !== null && parts.minute !== null && (hasOffset || !isZulu)) {
    return formatWallTime(parts.hour, parts.minute);
  }

  const date = new Date(event.start);
  if (Number.isNaN(date.getTime())) return "";
  return formatWithTimeZone(date, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: event.timeZone ?? DEFAULT_TIME_ZONE,
  });
}

export function formatCalendarDateTime(event: CalendarTimeLike): string {
  const day = formatCalendarDay(event.start, { month: "short", day: "numeric" });
  return event.allDay ? `${day}, all day` : `${day}, ${formatCalendarTime(event)}`;
}

export function relativeCalendarDayLabel(value: string | Date, today = todayInTimeZone()) {
  const date = value instanceof Date ? value : calendarDayDate(value);
  const diff = Math.round(
    (startOfDay(date).getTime() - startOfDay(today).getTime()) / 86400_000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatCalendarDayDate(date, { weekday: "long", month: "short", day: "numeric" });
}

export function calendarInstantMs(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWallTime(hour: number, minute: number): string {
  const date = new Date(2000, 0, 1, hour, minute);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatWithTimeZone(date: Date, options: Intl.DateTimeFormatOptions): string {
  try {
    return date.toLocaleTimeString([], options);
  } catch {
    const { timeZone: _timeZone, ...fallback } = options;
    return date.toLocaleTimeString([], fallback);
  }
}

function dateKeyInTimeZone(date: Date, timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value ?? String(date.getFullYear());
    const month = parts.find((p) => p.type === "month")?.value ?? String(date.getMonth() + 1);
    const day = parts.find((p) => p.type === "day")?.value ?? String(date.getDate());
    return `${year}-${month}-${day}`;
  } catch {
    return keyFromDate(date);
  }
}
