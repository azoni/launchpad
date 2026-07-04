import { getStats } from "@/lib/stats/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public activity endpoint — AI-coach usage/cost + affiliate clicks.
 * GET /api/stats  →  JSON (no auth; contains no secrets or PII beyond truncated prompts).
 */
export async function GET() {
  const data = await getStats();
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
