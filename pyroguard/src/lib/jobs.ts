"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { TEMPLATE_WORKSPACE_ID } from "@/lib/firebase/collections";
import type { SeedJob } from "@/lib/seed-data";

/**
 * Jobs come from the read-only template — same 6 Seattle jobs for every demo session.
 */
export function useJobs(_workspaceId: string | null): SeedJob[] {
  const [jobs, setJobs] = useState<SeedJob[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, `workspaces/${TEMPLATE_WORKSPACE_ID}/jobs`)),
      (snap) => setJobs(snap.docs.map((d) => d.data() as SeedJob))
    );
    return () => unsub();
  }, []);
  return jobs;
}

export type ReportDoc = {
  id: string;
  site: string;
  jobId: string;
  date: string;
  type: string;
  status: "PASS" | "FAIL";
  deficiencies: number;
  generatedAt: number;
};

/**
 * Reports come from two places:
 *  - workspaces/_template/reports — seeded historical reports everyone sees
 *  - workspaces/{uid}/reports      — reports this user generated during their session
 */
export function useReports(workspaceId: string | null): ReportDoc[] {
  const [seed, setSeed] = useState<ReportDoc[]>([]);
  const [mine, setMine] = useState<ReportDoc[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, `workspaces/${TEMPLATE_WORKSPACE_ID}/reports`),
        orderBy("generatedAt", "desc")
      ),
      (snap) =>
        setSeed(
          snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as unknown as ReportDoc)
          )
        )
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!workspaceId || workspaceId === TEMPLATE_WORKSPACE_ID) {
      setMine([]);
      return;
    }
    const unsub = onSnapshot(
      query(
        collection(db, `workspaces/${workspaceId}/reports`),
        orderBy("generatedAt", "desc")
      ),
      (snap) =>
        setMine(
          snap.docs.map(
            (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as unknown as ReportDoc)
          )
        ),
      () => setMine([])
    );
    return () => unsub();
  }, [workspaceId]);

  return [...mine, ...seed].sort((a, b) => b.generatedAt - a.generatedAt);
}

export const PRIORITY_COLOR: Record<string, string> = {
  Critical: "#ff2d2d",
  High: "#ff7a00",
  Medium: "#f5c842",
  Low: "#4ade80",
};

export const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: "#0d2e1a", text: "#4ade80", label: "Completed" },
  "in-progress": { bg: "#1a2000", text: "#c8f542", label: "In Progress" },
  pending: { bg: "#1a1a2e", text: "#8888ff", label: "Pending" },
};
