import { useEffect, useState } from "react";
import { ensureProject } from "../data/projects";
import { useGuestMode } from "../lib/guestMode";
import type { Project } from "../types";
import { useAuth } from "./useAuth";

export function useProject() {
  const { user } = useAuth();
  const { isGuest } = useGuestMode();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setLoading(true);
      ensureProject("guest")
        .then(setProject)
        .finally(() => setLoading(false));
      return;
    }
    if (!user) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    ensureProject(user.uid)
      .then(setProject)
      .finally(() => setLoading(false));
  }, [user, isGuest]);

  return { project, loading };
}
