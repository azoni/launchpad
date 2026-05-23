import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { verifyUid } from "@/lib/api/auth";
import { getAnthropic, logLlmCall } from "@/lib/llm/anthropic";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-haiku-4-5";

/** Cheap fallback: when neither attendee domain nor title regex extract a company,
 *  ask Claude Haiku to look at a small batch and guess. */
export async function POST(req: Request) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { items?: Array<{ id: string; summary: string; location?: string | null }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const items = (body.items ?? []).slice(0, 20);
  if (items.length === 0) return NextResponse.json({ guesses: {} });

  const lines = items
    .map(
      (it, i) =>
        `${i + 1}. id=${it.id} | title="${it.summary}"${it.location ? ` | location="${it.location}"` : ""}`,
    )
    .join("\n");

  const prompt =
    `You're parsing calendar events that look like job interviews. For each line, output the most likely COMPANY name only (no role, no commentary). If you can't tell with reasonable confidence, output "?". Use the format \`id=<id>: <COMPANY>\` one per line. Don't invent companies — only output a name if there's a clear signal.\n\n${lines}`;

  let raw: string;
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    const client = getAnthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
    raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM call failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  logLlmCall({
    title: "Interview suggestion: guess companies",
    description: `${items.length} events`,
    model: MODEL,
    inputTokens,
    outputTokens,
  });

  const guesses: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*(?:[-*]\s*)?id=(\S+?):\s*(.+?)\s*$/);
    if (!m) continue;
    const [, id, company] = m;
    const clean = company.trim().replace(/^"|"$/g, "");
    if (clean && clean !== "?" && clean.length < 80) {
      guesses[id] = clean;
    }
  }
  return NextResponse.json({ guesses });
}
