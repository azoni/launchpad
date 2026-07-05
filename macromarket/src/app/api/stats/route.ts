import { getStats } from "@/lib/stats/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public activity endpoint — AI-coach usage/cost + affiliate clicks.
 * GET /api/stats  →  JSON (no auth; no secrets, only truncated prompts).
 * Cached 60s to keep Firestore read volume (and quota use) low under traffic.
 */
export async function GET() {
  try {
    const data = await getStats();
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=60, s-maxage=60",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("[/api/stats] error:", e);
    return new Response(JSON.stringify({ error: "stats temporarily unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
