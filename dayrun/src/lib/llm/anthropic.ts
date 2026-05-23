import Anthropic from "@anthropic-ai/sdk";

const MCP_LOG_URL = "https://azoni-mcp.onrender.com/activity/log";

let _client: Anthropic | null = null;
export function getAnthropic(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

const PRICING: Record<string, { in: number; out: number }> = {
  // $ per 1M tokens
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
  "claude-opus-4-7": { in: 5.0, out: 25.0 },
  "claude-haiku-4-5": { in: 1.0, out: 5.0 },
};

export function priceUSD(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model] ?? PRICING["claude-sonnet-4-6"];
  return (inputTokens * p.in + outputTokens * p.out) / 1_000_000;
}

/** Fire-and-forget activity log to the launchpad MCP. */
export function logLlmCall(args: {
  title: string;
  description: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  const key = process.env.MCP_ADMIN_KEY ?? process.env.NEXT_PUBLIC_MCP_READ_KEY;
  if (!key) return;
  const cost = priceUSD(args.model, args.inputTokens, args.outputTokens);
  fetch(MCP_LOG_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      type: "llm_call",
      title: args.title,
      source: "launchpad:dayrun",
      description: args.description.slice(0, 200),
      model: args.model,
      tokens: {
        input: args.inputTokens,
        output: args.outputTokens,
        total: args.inputTokens + args.outputTokens,
      },
      cost,
    }),
  }).catch(() => {});
}
