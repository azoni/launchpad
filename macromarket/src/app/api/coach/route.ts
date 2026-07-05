import Anthropic from "@anthropic-ai/sdk";
import { FieldValue } from "firebase-admin/firestore";
import { searchCatalog } from "@/lib/catalog";
import { logLlmCall } from "@/lib/claude/cost";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { allow } from "@/lib/rateLimit";
import { logChat } from "@/lib/stats/log";
import type { CatalogItem, CategorySlug, DietTag } from "@/lib/catalog/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = "claude-haiku-4-5";

// Cost guards: per-IP + global burst (in-memory, per instance) and a hard daily
// ceiling (Firestore, cross-instance). Each coach turn caps at max_tokens×3 rounds.
const PER_IP_PER_MIN = 8;
const GLOBAL_PER_MIN = 40;
const DAILY_MAX = 3000; // ~ a few $/day worst case at Haiku pricing

function err(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Atomic daily counter in Firestore; false once the day's cap is exceeded. */
async function underDailyCap(): Promise<boolean> {
  try {
    const db = getAdminDb();
    if (!db) return true; // no store → rely on in-memory limits
    const day = new Date().toISOString().slice(0, 10);
    const ref = db.collection(COLLECTIONS.rateLimits).doc(`coach-${day}`);
    await ref.set({ count: FieldValue.increment(1) }, { merge: true });
    const snap = await ref.get();
    return ((snap.data()?.count as number | undefined) ?? 0) <= DAILY_MAX;
  } catch {
    return true; // never hard-fail on the limiter
  }
}

const SYSTEM = `You are the MacroMarket Protein Coach. You help people hit their protein goals as cheaply as possible. MacroMarket's signature metric is DOLLARS PER GRAM OF PROTEIN.

Rules:
- Ground every product recommendation in the MacroMarket catalog via the search_catalog tool. NEVER invent products, prices, or $/g values. If the tool returns nothing useful, say so.
- Lead with the cheapest option that fits the person's constraints (diet, form). Whole foods (chicken, eggs, canned tuna, lentils) are often cheapest — say so honestly and do not upsell supplements.
- If asked how much protein someone needs, use ~0.7-1.0 g per lb of body weight for active adults, and note it's general guidance, not medical advice.
- For EVERY product you recommend you MUST include its buy link as a markdown link exactly like [Buy on Amazon](buyUrl), using the exact buyUrl string from the tool result, plus its cost per gram. Never recommend a product without its buy link. Recommend at most 3 options, not a wall of text.
- Be concise and friendly. Short paragraphs. No markdown tables.
- If asked something unrelated to protein, nutrition, or budget, redirect briefly.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_catalog",
    description:
      "Search the MacroMarket catalog for the cheapest protein sources, ranked by dollars per gram of protein. Use this for every product recommendation.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "free-text, e.g. 'vegan powder', 'canned fish', 'cheap whole food'",
        },
        dietTag: {
          type: "string",
          enum: [
            "vegan",
            "vegetarian",
            "pescatarian",
            "keto",
            "low-carb",
            "gluten-free",
            "dairy-free",
            "paleo",
            "whole30",
          ],
        },
        category: { type: "string", description: "optional category slug filter" },
        maxDollarPerGram: {
          type: "number",
          description: "only return items at or below this dollars-per-gram-of-protein (e.g. 0.05)",
        },
        limit: { type: "integer", description: "max results (default 5, max 8)" },
      },
      required: ["query"],
    },
  },
];

function compact(i: CatalogItem) {
  const cpg = i.metrics.costPerGramProteinCents;
  const dose = i.metrics.proteinDosePriceCents;
  return {
    slug: i.id,
    name: i.name,
    brand: i.brand,
    form: i.form,
    dietTags: i.dietTags,
    proteinPerServing_g: i.proteinPerServing_g,
    dollarsPerGramProtein: cpg != null ? Number((cpg / 100).toFixed(3)) : null,
    dosePrice20g: dose != null ? Number((dose / 100).toFixed(2)) : null,
    priceUSD:
      i.effectivePriceCents != null
        ? Number((i.effectivePriceCents / 100).toFixed(2))
        : null,
    inStock: i.inStock,
    buyUrl: i.buyUrl,
  };
}

async function runTool(input: unknown): Promise<string> {
  const p = (input ?? {}) as {
    query?: string;
    dietTag?: string;
    category?: string;
    maxDollarPerGram?: number;
    limit?: number;
  };
  const items = await searchCatalog({
    query: p.query ?? "",
    dietTag: p.dietTag as DietTag | undefined,
    category: p.category as CategorySlug | undefined,
    maxCostPerGramCents:
      p.maxDollarPerGram != null ? p.maxDollarPerGram * 100 : undefined,
    limit: Math.min(p.limit ?? 5, 8),
  });
  return JSON.stringify(items.map(compact));
}

interface InMsg {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return err("AI coach is not configured.", 500);

  // --- Rate limiting (cost protection) ---
  const ip =
    req.headers.get("x-nf-client-connection-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon";
  if (!allow(`coach:${ip}`, PER_IP_PER_MIN) || !allow("coach:global", GLOBAL_PER_MIN)) {
    return err("You're messaging too fast — give the coach a few seconds.", 429);
  }
  if (!(await underDailyCap())) {
    return err("The coach has reached its daily limit. Please try again tomorrow.", 429);
  }

  let body: { messages?: InMsg[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const history = (body.messages ?? [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));

  if (history.length === 0) {
    return new Response(JSON.stringify({ error: "No message provided." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();
  const lastUser =
    [...history].reverse().find((m) => m.role === "user")?.content ?? "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      let inTok = 0;
      let outTok = 0;
      const messages: Anthropic.MessageParam[] = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        for (let round = 0; round < 3; round++) {
          const s = client.messages.stream({
            model: MODEL,
            max_tokens: 700,
            system: SYSTEM,
            tools: TOOLS,
            messages,
          });
          s.on("text", (t) => send({ type: "content", text: t }));
          const final = await s.finalMessage();
          inTok += final.usage.input_tokens;
          outTok += final.usage.output_tokens;

          if (final.stop_reason === "tool_use" && round < 2) {
            const toolUses = final.content.filter(
              (c): c is Anthropic.ToolUseBlock => c.type === "tool_use",
            );
            messages.push({ role: "assistant", content: final.content });
            const results: Anthropic.ToolResultBlockParam[] = [];
            for (const tu of toolUses) {
              send({ type: "tool", text: "Searching the protein catalog…" });
              results.push({
                type: "tool_result",
                tool_use_id: tu.id,
                content: await runTool(tu.input),
              });
            }
            messages.push({ role: "user", content: results });
            continue;
          }
          break;
        }

        logLlmCall({
          title: "MacroMarket coach",
          description: lastUser,
          model: MODEL,
          inputTokens: inTok,
          outputTokens: outTok,
        });
        await logChat({
          prompt: lastUser,
          model: MODEL,
          inputTokens: inTok,
          outputTokens: outTok,
        });
        send({ type: "done" });
      } catch (e) {
        console.error("coach error:", e);
        send({ type: "error", text: "The coach hit a snag. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
