import { getStats } from "@/lib/stats/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public activity endpoint — AI-coach usage/cost + affiliate clicks.
 * GET /api/stats  →  JSON (no auth; no secrets, only truncated prompts).
 */
export async function GET() {
  try {
    const data = await getStats();
    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
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
