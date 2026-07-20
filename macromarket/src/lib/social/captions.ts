/**
 * AI Instagram-caption generation, shared by the composer's "AI rewrite"
 * button and the daily scheduled job.
 */
import Anthropic from "@anthropic-ai/sdk";
import { logLlmCall } from "@/lib/claude/cost";

export const CAPTION_MODEL = "claude-haiku-4-5";

const SYSTEM = `You write Instagram captions for MacroMarket, a site that ranks foods by cost per 10 grams of protein. Voice: knowledgeable friend who loves a good deal — practical, upbeat, zero hype-bro energy. Rules: lead with a strong one-line hook; mention the concrete value stat when given; keep it under 120 words before hashtags; end with "🛒 Link in bio" then exactly one line of 8-12 relevant hashtags (mix broad #protein #highprotein with specific ones). Instagram captions cannot contain clickable links — never paste a URL except the plain site name macromarket-app.netlify.app. Return ONLY the caption text.`;

export async function generateCaption(
  kind: string,
  context: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("AI is not configured");
  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: CAPTION_MODEL,
    max_tokens: 400,
    system: SYSTEM,
    messages: [
      { role: "user", content: `Write the caption for this ${kind} post:\n${context}` },
    ],
  });
  const caption = msg.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("")
    .trim();
  logLlmCall({
    title: "MacroMarket social caption",
    description: context.slice(0, 180),
    model: CAPTION_MODEL,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
  });
  return caption;
}
