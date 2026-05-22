"use client";

import { useState } from "react";
import type { EventDoc } from "@/lib/firebase/collections";

export function EventCard({
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

  const start = new Date(event.start);
  const time = event.allDay
    ? "All day"
    : start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="flex items-start gap-3 border-2 border-ink rounded-xl p-3 bg-card">
      <span
        className={`shrink-0 px-2 py-1 text-xs rounded-md font-bold border-2 border-ink ${
          optimistic ? "bg-primary text-white" : "bg-muted text-ink"
        }`}
      >
        {time}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{event.summary}</p>
        {event.location && (
          <p className="text-xs text-muted-foreground truncate">{event.location}</p>
        )}
      </div>
      {editable ? (
        <button
          onClick={flip}
          disabled={pending}
          aria-pressed={optimistic}
          className={`sticker shrink-0 ${
            optimistic ? "bg-sun" : "bg-card text-muted-foreground"
          }`}
          title={optimistic ? "Hide from public profile" : "Show on public profile"}
        >
          {optimistic ? "public" : "private"}
        </button>
      ) : (
        optimistic && <span className="sticker shrink-0">public</span>
      )}
    </div>
  );
}
