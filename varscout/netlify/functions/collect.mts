// Scheduled: fold one poll of the Variational Omni endpoint into the rolling
// history that /api/aggregates serves. The real work lives in the Next.js route
// so it shares the app's scoring and accumulator code; this only fires it.
//
// Every 5 minutes matches the upstream refresh — quotes land within a ~60s band
// and the endpoint advertises s-maxage=60, so polling faster buys nothing.
export default async () => {
  const key = process.env.MCP_ADMIN_KEY;
  if (!key) {
    console.error("collect: no MCP_ADMIN_KEY configured");
    return;
  }
  const base = process.env.URL ?? "https://varscout.netlify.app";
  try {
    const res = await fetch(`${base}/api/collect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
    });
    console.log("collect:", res.status, await res.text());
  } catch (e) {
    console.error("collect failed:", e);
  }
};

export const config = { schedule: "*/5 * * * *" };
