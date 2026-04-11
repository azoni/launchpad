import { useEffect, useState } from "react";
import { ensureProject } from "../data/projects";
import type { Project } from "../types";
import { useAuth } from "./useAuth";

export function useProject() {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    ensureProject(user.uid)
      .then(setProject)
      .finally(() => setLoading(false));
  }, [user]);

  return { project, loading };
}
