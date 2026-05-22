"use client";

import type { EventDoc } from "@/lib/firebase/collections";
import { EventCard } from "./EventCard";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export function WeekView({
  events,
  editable,
  onToggleVisibility,
  emptyState,
}: {
  events: EventDoc[];
  editable?: boolean;
  onToggleVisibility?: (id: string, next: boolean) => Promise<void> | void;
  emptyState?: React.ReactNode;
}) {
  if (events.length === 0) {
    return <div className="chunky p-8 text-center">{emptyState ?? "No events yet."}</div>;
  }

  // Group by local-day key (YYYY-MM-DD).
  const groups = new Map<string, { date: Date; items: EventDoc[] }>();
  for (const ev of events) {
    const d = startOfDay(new Date(ev.start));
    const key = d.toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, { date: d, items: [] });
    groups.get(key)!.items.push(ev);
  }
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-6">
      {sorted.map(([key, { date, items }]) => (
        <div key={key} className="chunky p-4 md:p-5">
          <h3 className="font-heading text-xl md:text-2xl font-bold mb-3">{dayLabel(date)}</h3>
          <div className="space-y-2">
            {items.map((ev) => (
              <EventCard
                key={ev.googleEventId}
                event={ev}
                editable={editable}
                onToggle={(next) => onToggleVisibility?.(ev.googleEventId, next)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
