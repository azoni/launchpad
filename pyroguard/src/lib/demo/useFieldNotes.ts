"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Persistent field notes for the demo — the inspector can jot anything, it survives reload,
 * and it all comes back at the debrief. Demonstrates "the app never loses a note."
 */
export type FieldNote = { id: string; text: string; tag?: string; ts: number; seeded?: boolean };

const KEY = "pg_field_notes";

const SEED: FieldNote[] = [
  { id: "seed-1", text: "Gate code 4471# — keypad sticks, press like you mean it.", tag: "ACCESS", ts: 0, seeded: true },
  { id: "seed-2", text: "Dana brings good coffee. Do not flow-test the riser before she's had hers.", tag: "FM", ts: 0, seeded: true },
];

function load(): FieldNote[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as { notes?: FieldNote[] };
    return Array.isArray(parsed?.notes) ? parsed.notes : SEED;
  } catch {
    return SEED;
  }
}

function save(notes: FieldNote[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, notes }));
  } catch {
    /* private mode / blocked storage — never crash the demo */
  }
}

export function useFieldNotes() {
  // Start empty so SSR and first client paint agree; hydrate from storage after mount.
  const [notes, setNotes] = useState<FieldNote[]>([]);

  useEffect(() => {
    const loaded = load();
    setNotes(loaded);
    try {
      if (!localStorage.getItem(KEY)) save(loaded); // persist the seed on first ever load
    } catch {
      /* ignore */
    }
  }, []);

  const add = useCallback((text: string, tag?: string) => {
    const t = text.trim();
    if (!t) return;
    setNotes((cur) => {
      const next = [
        ...cur,
        { id: `n-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, text: t, tag, ts: Date.now() },
      ];
      save(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setNotes((cur) => {
      const next = cur.filter((n) => n.id !== id);
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setNotes(SEED);
    save(SEED);
  }, []);

  return { notes, add, remove, reset };
}
