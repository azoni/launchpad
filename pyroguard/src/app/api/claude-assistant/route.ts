import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase/admin";
import { logCost } from "@/lib/claude/cost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-5";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Mode = "code_lookup" | "draft_deficiency" | "report_narrative" | "historical_qa";

interface Body {
  mode: Mode;
  input: string;
  context?: { workspaceId?: string; buildingId?: string; deviceId?: string; customerId?: string };
}

const SYSTEM_PROMPT = `You are an expert assistant for commercial fire alarm and life-safety inspectors.

Citation rules (strict):
- Only cite an NFPA or IFC section if you are 100% certain of the exact section number against the current edition.
- When uncertain, return citation: null and state that the inspector must verify.
- Never fabricate section numbers.

Style:
- Be concise and field-ready. Inspectors are reading this on a phone.
- Use structured JSON when requested.
- Include a short "verify" note if anything should be double-checked.`;

function buildPrompt(mode: Mode, input: string, ctx: string | null) {
  switch (mode) {
    case "code_lookup":
      return `Inspector question: "${input}".
${ctx ? `Context:\n${ctx}\n` : ""}
Respond with JSON:
{
  "answer": "<2-4 sentence plain-English answer>",
  "citations": [{"standard": "NFPA 72" | "NFPA 25" | "NFPA 10" | "NFPA 17" | "NFPA 17A" | "NFPA 96" | "NFPA 101" | "IFC Ch 9", "section": "<§ number or null>", "confidence": 0.0-1.0}],
  "verify": "<short note on what the inspector should verify, or empty string>"
}`;
    case "draft_deficiency":
      return `Draft a formal deficiency from this inspector note: "${input}".
${ctx ? `Device context:\n${ctx}\n` : ""}
Respond with JSON:
{
  "structured": {
    "description": "<formal description>",
    "severity": "low" | "medium" | "high" | "critical",
    "correctiveAction": "<what must be done>",
    "suggestedDueDays": 7 | 14 | 30 | 60,
    "citation": { "standard": "...", "section": "<§ or null>" } | null
  },
  "answer": "<1-2 sentence summary of the deficiency>",
  "citations": [],
  "verify": "<short note>"
}`;
    case "report_narrative":
      return `Write a concise executive summary narrative (3-5 sentences, field-report tone) for an inspection with these facts: ${input}.
${ctx ? `Additional context:\n${ctx}\n` : ""}
Respond with JSON: { "answer": "<narrative>", "citations": [], "verify": "" }`;
    case "historical_qa":
      return `Answer this question using ONLY the database records in the context. If the answer is not in the context, say you don't have that data.
Question: "${input}".
${ctx ? `Records:\n${ctx}\n` : "No records provided."}
Respond with JSON: { "answer": "<answer>", "citations": [], "verify": "" }`;
    default:
      return input;
  }
}

async function buildContext(mode: Mode, ctx: Body["context"]): Promise<string | null> {
  if (!ctx?.workspaceId || !UUID_RE.test(ctx.workspaceId)) return null;
  try {
    if (mode === "draft_deficiency" && ctx.buildingId && ctx.customerId && ctx.deviceId) {
      const snap = await adminDb
        .doc(
          `workspaces/${ctx.workspaceId}/customers/${ctx.customerId}/buildings/${ctx.buildingId}/devices/${ctx.deviceId}`
        )
        .get();
      if (snap.exists) {
        const d = snap.data()!;
        return `Device: ${d.manufacturer} ${d.model} (${d.type}) at ${d.location}. Install date: ${new Date(d.installDate).toISOString().slice(0, 10)}.`;
      }
    }
    if (mode === "historical_qa") {
      const custSnap = await adminDb.collection(`workspaces/${ctx.workspaceId}/customers`).limit(10).get();
      const custs = custSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return `Customers (${custs.length}):\n${JSON.stringify(custs)}`;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validModes: Mode[] = ["code_lookup", "draft_deficiency", "report_narrative", "historical_qa"];
  if (!validModes.includes(body.mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  if (!body.input || body.input.length > 2000) {
    return NextResponse.json({ error: "Input missing or too long" }, { status: 400 });
  }

  const ctx = await buildContext(body.mode, body.context);
  const prompt = buildPrompt(body.mode, body.input, ctx);

  const client = new Anthropic({ apiKey });
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = resp.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("\n");

    logCost({
      title: `pyroguard/${body.mode}`,
      description: body.input,
      model: MODEL,
      input: resp.usage.input_tokens,
      output: resp.usage.output_tokens,
    });

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ answer: text, citations: [], verify: "" });
    }
    try {
      const parsed = JSON.parse(match[0]);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ answer: text, citations: [], verify: "" });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Claude call failed" },
      { status: 502 }
    );
  }
}
