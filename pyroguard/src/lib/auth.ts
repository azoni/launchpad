"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pyroguard_workspace_id";

export function getOrCreateWorkspaceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function clearWorkspaceId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function useWorkspaceId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    setId(localStorage.getItem(STORAGE_KEY));
  }, []);
  return id;
}
