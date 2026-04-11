// LLM helper for the review queue. Calls Anthropic Claude with a strict
// system prompt: explain in plain English what's going on, suggest a
// classification, and return a structured response. The function is
// informational only — it never writes to Firestore. The user has to commit
// any decision via the UI's action buttons.
//
// Cost logging: every successful call posts to the launchpad MCP activity
// feed so portfolio-wide costs can be tracked. Fire-and-forget.

import type { Handler } from "@netlify/functions";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MCP_ACTIVITY_URL = "https://azoni-mcp.onrender.com/activity/log";
const MODEL = "claude-haiku-4-5-20251001";
const APP_SLUG = "crypto-tax-2025";

// Anthropic claude-haiku-4-5 pricing (per 1M tokens). Update if pricing changes.
const PRICE_INPUT_PER_MTOK = 0.8;
const PRICE_OUTPUT_PER_MTOK = 4.0;

const SYSTEM_PROMPT = `You are a helper for a personal crypto tax reconstruction app.
Your job: explain a flagged transaction in plain English (2-4 sentences) and
suggest a likely classification. NEVER do math. NEVER invent prices. NEVER
calculate gains or losses. The user is responsible for the final answer.

Allowed classifications: buy, sell, swap, transfer_in, transfer_out, bridge,
fee, nft_buy, nft_sell, nft_transfer, nft_mint, perp_open, perp_close,
realized_pnl, spam, unknown.

Respond as compact JSON: { "explanation": "...", "suggestedAction": "...",
"confidence": 0.0-1.0 }.`;

interface AnthropicResponse {
  content: Array<{ text: string }>;
  usage?: { input_tokens: number; output_tokens: number };
}

function logCost(usage: { input: number; output: number }, summary: string) {
  const adminKey = process.env.MCP_ADMIN_KEY;
  if (!adminKey) return;
  const cost =
    (usage.input * PRICE_INPUT_PER_MTOK) / 1_000_000 +
    (usage.output * PRICE_OUTPUT_PER_MTOK) / 1_000_000;

  fetch(MCP_ACTIVITY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminKey}`,
    },
    body: JSON.stringify({
      type: "llm_call",
      title: "Review item explanation",
      source: `launchpad:${APP_SLUG}`,
      description: summary.slice(0, 200),
      model: MODEL,
      tokens: {
        input: usage.input,
        output: usage.output,
        total: usage.input + usage.output,
      },
      cost: Number(cost.toFixed(6)),
    }),
  }).catch(() => {});
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }),
    };
  }

  let payload: { item?: unknown; tx?: unknown };
  try {
    payload = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const userPrompt = `Review item: ${JSON.stringify(payload.item ?? null)}
Transaction: ${JSON.stringify(payload.tx ?? null)}

Respond with the JSON object only.`;

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { statusCode: 502, body: JSON.stringify({ error: text }) };
    }

    const data = (await res.json()) as AnthropicResponse;
    const text = data.content?.[0]?.text ?? "";

    // Log token usage to MCP (fire-and-forget)
    if (data.usage) {
      logCost(
        { input: data.usage.input_tokens, output: data.usage.output_tokens },
        userPrompt
      );
    }

    // Try to parse JSON out of the model response
    let parsed: { explanation?: string; suggestedAction?: string; confidence?: number } = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch {
      parsed = { explanation: text };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        explanation: parsed.explanation ?? text,
        suggestedAction: parsed.suggestedAction ?? "unknown",
        confidence: parsed.confidence ?? 0.5,
      }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
    };
  }
};
