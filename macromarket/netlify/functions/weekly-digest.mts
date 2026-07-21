// Scheduled: build (and send, if Resend is configured) the weekly protein-deals
// email digest. Without RESEND_API_KEY the digest is stored in Firestore for
// manual send — nothing breaks either way.
export default async () => {
  const key = process.env.ADMIN_KEY ?? process.env.MCP_ADMIN_KEY;
  if (!key) {
    console.error("weekly-digest: no ADMIN_KEY configured");
    return;
  }
  const base = process.env.URL ?? "https://macromarket-app.netlify.app";
  try {
    const res = await fetch(`${base}/api/admin/daily?task=digest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
    });
    console.log("weekly-digest:", res.status, await res.text());
  } catch (e) {
    console.error("weekly-digest failed:", e);
  }
};

// Mondays 14:00 UTC ≈ 7am Pacific.
export const config = { schedule: "0 14 * * 1" };
