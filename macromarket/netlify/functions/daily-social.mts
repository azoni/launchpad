// Scheduled: prepare the day's Instagram post (content picked + caption
// written, waiting in /admin → Social under "Prepared for you").
export default async () => {
  const key = process.env.ADMIN_KEY ?? process.env.MCP_ADMIN_KEY;
  if (!key) {
    console.error("daily-social: no ADMIN_KEY configured");
    return;
  }
  const base = process.env.URL ?? "https://macromarket-app.netlify.app";
  try {
    const res = await fetch(`${base}/api/admin/daily?task=social`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
    });
    console.log("daily-social:", res.status, await res.text());
  } catch (e) {
    console.error("daily-social failed:", e);
  }
};

// 13:10 UTC — right after the blog draft, so a fresh post can be featured.
export const config = { schedule: "10 13 * * *" };
