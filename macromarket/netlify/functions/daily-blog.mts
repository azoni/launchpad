// Scheduled: generate the day's AI blog draft (lands in /admin → Content).
// The heavy lifting runs in the Next.js API route's own invocation, so this
// function only fires the request and reports the outcome.
export default async () => {
  const key = process.env.ADMIN_KEY ?? process.env.MCP_ADMIN_KEY;
  if (!key) {
    console.error("daily-blog: no ADMIN_KEY configured");
    return;
  }
  const base = process.env.URL ?? "https://macromarket-app.netlify.app";
  try {
    const res = await fetch(`${base}/api/admin/daily?task=blog`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
    });
    console.log("daily-blog:", res.status, await res.text());
  } catch (e) {
    console.error("daily-blog failed:", e);
  }
};

// 13:00 UTC ≈ 6am Pacific — draft is waiting before the day starts.
export const config = { schedule: "0 13 * * *" };
