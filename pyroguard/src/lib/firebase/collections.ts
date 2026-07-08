export const C = {
  workspaces: "workspaces",
  jobs: (wsId: string) => `workspaces/${wsId}/jobs`,
  reports: (wsId: string) => `workspaces/${wsId}/reports`,
  deficiencies: (wsId: string) => `workspaces/${wsId}/deficiencies`,
  checklistState: (wsId: string) => `workspaces/${wsId}/checklistState`,
  // Per-inspector UI preferences (customizable deficiency view + saved presets).
  prefs: (wsId: string) => `workspaces/${wsId}/meta/prefs`,
} as const;

export const TEMPLATE_WORKSPACE_ID = "_template";
