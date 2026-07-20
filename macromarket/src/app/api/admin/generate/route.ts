import { generateBlogDraft } from "@/lib/blogGenerate";
import { allow } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authed(req: Request): boolean {
  const key = process.env.ADMIN_KEY ?? process.env.MCP_ADMIN_KEY;
  return !!key && req.headers.get("authorization") === `Bearer ${key}`;
}
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  if (!authed(req)) return json({ error: "unauthorized" }, 401);
  if (!process.env.ANTHROPIC_API_KEY) return json({ error: "AI is not configured" }, 503);
  if (!allow("blog-generate", 12)) return json({ error: "slow down" }, 429);

  const b = (await req.json().catch(() => ({}))) as { topic?: string };
  const topic = (b.topic ?? "").trim();
  if (!topic) return json({ error: "topic is required" }, 400);

  try {
    return json(await generateBlogDraft(topic));
  } catch (e) {
    console.error("generate error", e);
    const msg = (e as Error).message;
    return json(
      { error: msg.includes("JSON") ? "could not parse the draft" : "generation failed" },
      502,
    );
  }
}
