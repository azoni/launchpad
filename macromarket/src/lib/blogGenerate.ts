/**
 * AI blog-draft generation, shared by the admin "Generate" button and the
 * daily scheduled job. Grounds every claim in curated catalog data (real
 * prices only) and returns a ready-to-save draft.
 */
import Anthropic from "@anthropic-ai/sdk";
import { CATALOG } from "@/data/catalog";
import { computeMetrics } from "@/lib/catalog/metrics";
import { logLlmCall } from "@/lib/claude/cost";
import { formatPer10g } from "@/lib/format";
import { slugify } from "@/lib/slug";

// Haiku, not Sonnet: Netlify caps non-streaming functions around ~26s, and
// Sonnet at full length runs right up against it (intermittent 504s). Haiku
// finishes comfortably and drafts are reviewed/edited before publishing anyway.
export const BLOG_MODEL = "claude-haiku-4-5";

const SYSTEM = `You write blog posts for MacroMarket, a site that ranks foods by cost per 10 grams of protein (its signature value metric).

Rules:
- Use ONLY the catalog data provided for any specific product, brand, price, or value claim. NEVER invent prices or products. General nutrition facts are fine.
- When you mention a catalog product, link it with a relative markdown link exactly like [Name](/food/slug) using the slug from the data.
- Be genuinely useful and honest (whole foods are usually cheaper than supplements — say so). No hype, no fake urgency.
- ~550–750 words. Use Markdown with ## subheadings, short paragraphs, and at least one bulleted list. Open with a 1–2 sentence hook.
- Always frame value as "price per 10g of protein".`;

export interface BlogDraft {
  title: string;
  slug: string;
  description: string;
  body: string;
}

/** Cheapest-first catalog digest the model is allowed to cite. */
function catalogDigest(): string {
  return CATALOG.map((s) => ({
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
}

export async function generateBlogDraft(topic: string): Promise<BlogDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI is not configured");

  const client = new Anthropic({ apiKey });
  const user = `Write a blog post about: "${topic}".

MacroMarket catalog data you may cite (cheapest per 10g of protein first):
${catalogDigest()}

Return STRICT JSON only (no prose, no code fences) in exactly this shape:
{"title": "concise post title", "description": "meta description, <=155 chars", "body": "full markdown body"}`;

  const msg = await client.messages.create({
    model: BLOG_MODEL,
    max_tokens: 1800,
    system: SYSTEM,
    messages: [{ role: "user", content: user }],
  });
  const text = msg.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("");
  logLlmCall({
    title: "MacroMarket blog draft",
    description: topic,
    model: BLOG_MODEL,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
  });

  const jsonStr = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const parsed = JSON.parse(jsonStr) as {
    title?: string;
    description?: string;
    body?: string;
  };
  const title = String(parsed.title ?? topic);
  return {
    title,
    slug: slugify(title),
    description: String(parsed.description ?? ""),
    body: String(parsed.body ?? ""),
  };
}
