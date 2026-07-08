const MCP_ACTIVITY_URL = "https://azoni-mcp.onrender.com/activity/log";
const APP_SLUG = "pyroguard";

// claude-sonnet-4-5 pricing per 1M tokens. Verify against https://docs.claude.com/en/docs/about-claude/models when updating.
export const PRICE_INPUT_PER_MTOK = 3.0;
export const PRICE_OUTPUT_PER_MTOK = 15.0;

export function calcCostUSD(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens * PRICE_INPUT_PER_MTOK) / 1_000_000 +
    (outputTokens * PRICE_OUTPUT_PER_MTOK) / 1_000_000
  );
}

export function logCost(opts: {
  title: string;
  description: string;
  model: string;
  input: number;
  output: number;
}) {
  const adminKey = process.env.MCP_ADMIN_KEY ?? process.env.NEXT_PUBLIC_MCP_READ_KEY;
  if (!adminKey) return;
  const cost = calcCostUSD(opts.input, opts.output);
  fetch(MCP_ACTIVITY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminKey}`,
    },
    body: JSON.stringify({
      type: "llm_call",
      title: opts.title,
      source: `launchpad:${APP_SLUG}`,
      description: opts.description.slice(0, 200),
      model: opts.model,
      tokens: { input: opts.input, output: opts.output, total: opts.input + opts.output },
      cost: Number(cost.toFixed(6)),
    }),
  }).catch(() => {});
}
