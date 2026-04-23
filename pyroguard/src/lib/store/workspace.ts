"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WorkspaceState {
  workspaceId: string | null;
  setWorkspaceId: (id: string | null) => void;
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspaceId: null,
      setWorkspaceId: (id) => set({ workspaceId: id }),
    }),
    { name: "pyroguard-workspace" }
  )
);
