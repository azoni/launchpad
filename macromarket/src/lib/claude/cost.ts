/** Fire-and-forget LLM cost logging to the launchpad MCP activity feed. */

const MCP_LOG_URL = "https://azoni-mcp.onrender.com/activity/log";
const APP_SLUG = "macromarket";

/** $ per 1M tokens. Update as model pricing changes. */
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-haiku-4-5": { in: 1.0, out: 5.0 },
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
};

export function priceUSD(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const p = PRICING[model] ?? PRICING["claude-haiku-4-5"];
  return (inputTokens * p.in + outputTokens * p.out) / 1_000_000;
}

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
      source: `launchpad:${APP_SLUG}`,
      description: args.description.slice(0, 200),
      model: args.model,
      tokens: {
        input: args.inputTokens,
        output: args.outputTokens,
        total: args.inputTokens + args.outputTokens,
      },
      cost: Number(cost.toFixed(6)),
    }),
  }).catch(() => {});
}
