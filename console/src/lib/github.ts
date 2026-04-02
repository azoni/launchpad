const GH_PAT = process.env.GH_PAT!;
const GH_OWNER = process.env.GH_OWNER || "azoni";
const GH_REPO = process.env.GH_REPO || "launchpad";

export async function triggerBuildWorkflow(
  prompt: string,
  buildId: string,
  slug: string
) {
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/build-app.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GH_PAT}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { prompt, build_id: buildId, slug },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
}

export async function getLatestWorkflowRun(slug: string) {
  const res = await fetch(
    `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/actions/workflows/build-app.yml/runs?per_page=5`,
    {
      headers: {
        Authorization: `Bearer ${GH_PAT}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  // Find a run whose inputs match our slug
  return (
    data.workflow_runs?.find(
      (run: { name: string; display_title: string }) =>
        run.display_title?.includes(slug) || run.name?.includes(slug)
    ) ?? data.workflow_runs?.[0] ?? null
  );
}
