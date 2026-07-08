"use client";
import { useEffect } from "react";
import { getOrCreateWorkspaceId } from "@/lib/auth";
import { useWorkspace } from "@/lib/store/workspace";

/**
 * Zero-latency gate: the demo reads jobs + reports from the shared template workspace,
 * and writes per-user mutations (checklist state, generated reports) to workspaces/{uid}.
 * No clone step required — the session is ready the moment the browser has a uuid.
 */
export function DemoGate({ children }: { children: React.ReactNode }) {
  const { workspaceId, setWorkspaceId } = useWorkspace();

  useEffect(() => {
    if (!workspaceId) {
      const id = getOrCreateWorkspaceId();
      setWorkspaceId(id);
    }
  }, [workspaceId, setWorkspaceId]);

  return <>{children}</>;
}
