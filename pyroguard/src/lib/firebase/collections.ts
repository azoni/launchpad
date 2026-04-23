export const C = {
  workspaces: "workspaces",
  jobs: (wsId: string) => `workspaces/${wsId}/jobs`,
  reports: (wsId: string) => `workspaces/${wsId}/reports`,
  deficiencies: (wsId: string) => `workspaces/${wsId}/deficiencies`,
  checklistState: (wsId: string) => `workspaces/${wsId}/checklistState`,
} as const;

export const TEMPLATE_WORKSPACE_ID = "_template";
