"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * The deficiencies the tester logs while playing (currently the one scripted corroded head).
 * Surfaced anytime via a HUD tray so "what did we find?" is always one tap away, and it
 * advances through its lifecycle (local → synced → quoted) on the existing flow callbacks.
 */
export type DemoDeficiency = {
  id: string;
  deviceId: string;
  label: string;
  floor: string;
  location: string;
  severity?: "critical" | "noncritical" | "impairment";
  status: "local" | "synced" | "quoted";
  photo: boolean;
  historyNote?: string;
};

const KEY = "pg_deficiencies";
const RANK: Record<DemoDeficiency["status"], number> = { local: 0, synced: 1, quoted: 2 };

function load(): DemoDeficiency[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { list?: DemoDeficiency[] };
    return Array.isArray(parsed?.list) ? parsed.list : [];
  } catch {
    return [];
  }
}

function save(list: DemoDeficiency[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, list }));
  } catch {
    /* ignore */
  }
}

export function useDeficiencies() {
  const [list, setList] = useState<DemoDeficiency[]>([]);

  useEffect(() => {
    setList(load());
  }, []);

  const add = useCallback((d: DemoDeficiency) => {
    setList((cur) => {
      if (cur.some((x) => x.id === d.id)) return cur; // idempotent — replay/reload safe
      const next = [...cur, d];
      save(next);
      return next;
    });
  }, []);

  const setSeverity = useCallback((id: string, severity: DemoDeficiency["severity"]) => {
    setList((cur) => {
      const next = cur.map((d) => (d.id === id ? { ...d, severity } : d));
      save(next);
      return next;
    });
  }, []);

  const setStatus = useCallback((id: string, status: DemoDeficiency["status"]) => {
    setList((cur) => {
      // forward-only: a reload can't regress a synced/quoted finding back to local
      const next = cur.map((d) => (d.id === id && RANK[status] > RANK[d.status] ? { ...d, status } : d));
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setList([]);
    save([]);
  }, []);

  return { list, add, setSeverity, setStatus, reset };
}
