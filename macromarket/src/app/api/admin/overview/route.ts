import { CATALOG } from "@/data/catalog";
import { getAdminDb } from "@/lib/firebase/admin";
import { getFlagged } from "@/lib/stats/flagged";
import { getStats } from "@/lib/stats/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authed(req: Request): boolean {
  const key = process.env.ADMIN_KEY ?? process.env.MCP_ADMIN_KEY;
  return !!key && req.headers.get("authorization") === `Bearer ${key}`;
}

/** Admin dashboard payload: usage/cost + affiliate clicks + flagged data + health. */
export async function GET(req: Request) {
  if (!authed(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stats = await getStats();
  const flagged = getFlagged();
  const health = {
    livePricing: process.env.AMAZON_LIVE_PRICING === "1",
    firestorePriceCache: process.env.PRICE_CACHE_FIRESTORE === "1",
    firebase: !!getAdminDb(),
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    amazon: !!(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET),
    catalogCount: CATALOG.length,
    flaggedCount: flagged.length,
  };

  return new Response(JSON.stringify({ stats, flagged, health }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
