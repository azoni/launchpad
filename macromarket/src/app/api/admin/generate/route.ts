import Anthropic from "@anthropic-ai/sdk";
import { CATALOG } from "@/data/catalog";
import { computeMetrics } from "@/lib/catalog/metrics";
import { logLlmCall } from "@/lib/claude/cost";
import { formatPer10g } from "@/lib/format";
import { allow } from "@/lib/rateLimit";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-6";

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

const SYSTEM = `You write blog posts for MacroMarket, a site that ranks foods by cost per 10 grams of protein (its signature value metric).

Rules:
- Use ONLY the catalog data provided for any specific product, brand, price, or value claim. NEVER invent prices or products. General nutrition facts are fine.
- When you mention a catalog product, link it with a relative markdown link exactly like [Name](/food/slug) using the slug from the data.
- Be genuinely useful and honest (whole foods are usually cheaper than supplements — say so). No hype, no fake urgency.
- ~550–750 words. Use Markdown with ## subheadings, short paragraphs, and at least one bulleted list. Open with a 1–2 sentence hook.
- Always frame value as "price per 10g of protein".`;

export async function POST(req: Request) {
  if (!authed(req)) return json({ error: "unauthorized" }, 401);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "AI is not configured" }, 503);
  if (!allow("blog-generate", 12)) return json({ error: "slow down" }, 429);

  const b = (await req.json().catch(() => ({}))) as { topic?: string };
  const topic = (b.topic ?? "").trim();
  if (!topic) return json({ error: "topic is required" }, 400);

  // Ground on curated BASELINE data (fast — no live catalog fetch), cheapest first.
  const data = CATALOG.map((s) => ({
    s,
    cpg: computeMetrics(s, s.priceCents).costPerGramProteinCents,
  }))
    .filter((x): x is { s: (typeof CATALOG)[number]; cpg: number } => x.cpg != null)
    .sort((a, b) => a.cpg - b.cpg)
    .slice(0, 30)
    .map(
      ({ s, cpg }) =>
        `- ${s.name}${s.brand ? ` (${s.brand})` : ""} — ${formatPer10g(
          cpg,
        )}/10g protein, ${s.proteinPerServing_g}g protein/serving, category ${s.category}, slug ${s.id}`,
    )
    .join("\n");

  const client = new Anthropic({ apiKey });
  const user = `Write a blog post about: "${topic}".

MacroMarket catalog data you may cite (cheapest per 10g of protein first):
${data}

Return STRICT JSON only (no prose, no code fences) in exactly this shape:
{"title": "concise post title", "description": "meta description, <=155 chars", "body": "full markdown body"}`;

  let text = "";
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 2500,
      system: SYSTEM,
      messages: [{ role: "user", content: user }],
    });
    text = msg.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");
    logLlmCall({
      title: "MacroMarket blog draft",
      description: topic,
      model: MODEL,
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
    });
  } catch (e) {
    console.error("generate error", e);
    return json({ error: "generation failed" }, 502);
  }

  try {
    const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const parsed = JSON.parse(jsonStr) as {
      title?: string;
      description?: string;
      body?: string;
    };
    const title = String(parsed.title ?? topic);
    return json({
      title,
      slug: slugify(title),
      description: String(parsed.description ?? ""),
      body: String(parsed.body ?? ""),
    });
  } catch {
    return json({ error: "could not parse the draft", raw: text.slice(0, 400) }, 502);
  }
}
