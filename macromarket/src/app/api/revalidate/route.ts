import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secret-gated on-demand revalidation — call after a price refresh / cron warm.
 * POST /api/revalidate?secret=...&path=/food/slug  (path optional, defaults to /)
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const path = url.searchParams.get("path") ?? "/";
  revalidatePath(path);
  return new Response(JSON.stringify({ revalidated: true, path }), {
    headers: { "Content-Type": "application/json" },
  });
}
