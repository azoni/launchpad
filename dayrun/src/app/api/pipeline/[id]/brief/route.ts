import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUid } from "@/lib/api/auth";
import {
  COLLECTIONS,
  type Brief,
  type OpportunityDoc,
  type OpportunityPrivateDoc,
} from "@/lib/firebase/collections";
import { getAnthropic, logLlmCall } from "@/lib/llm/anthropic";
import { FieldValue } from "firebase-admin/firestore";
import { formatPipelineDate, getNextRoundAt, visibleRounds } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const MODEL = "claude-sonnet-4-6";

function buildPrompt(opp: OpportunityDoc, contextHint: string | null): string {
  return [
    `You're helping a senior engineer prep for a job interview. Generate a tight, scannable prep brief in markdown.`,
    ``,
    `Company: ${opp.company}`,
    `Role: ${opp.role}`,
    opp.source ? `Source / how I got in: ${opp.source}` : "",
    `Current stage: ${opp.status}`,
    opp.nextStep ? `Next step: ${opp.nextStep}${opp.nextStepBy ? ` (${opp.nextStepBy})` : ""}` : "",
    getNextRoundAt(opp) ? `Next round date: ${formatPipelineDate(getNextRoundAt(opp))}` : "",
    visibleRounds(opp).length > 0
      ? `Interview rounds so far:\n${visibleRounds(opp)
          .map((round) => `- ${formatPipelineDate(round.scheduledAt)}: ${round.title} (${round.outcome})`)
          .join("\n")}`
      : "",
    contextHint
      ? `\nExtra context the user wants you to incorporate (TRUST THIS over the company/role fields if there's a conflict):\n"""\n${contextHint.slice(0, 4000)}\n"""`
      : "",
    ``,
    `Output exactly these sections, in this order, each with a level-3 markdown heading:`,
    `1. ### Company snapshot — 2–3 sentences: what they do, sector, scale, anything distinctive.`,
    `2. ### Role focus — what this role typically requires; calibrate to the role title.`,
    `3. ### Likely interview topics — 3–5 bullets. Specific to this company + role.`,
    `4. ### Prep checklist — 5–7 bullets. Actionable items I can do this week.`,
    `5. ### Smart questions for them — 3–4 bullets. Sharp, role-specific, not generic.`,
    ``,
    `Rules: tight bullets, no padding, no emoji, no preamble. Assume the reader is technically deep. If your model knowledge is stale, note that briefly in the snapshot rather than guessing recent news.`,
  ]
    .filter(Boolean)
    .join("\n");
}

function clean(s: unknown, max = 2000): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().slice(0, max);
  return t.length === 0 ? null : t;
}

export async function POST(req: Request, ctx: Ctx) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const oppRef = adminDb.collection(COLLECTIONS.opportunities(uid)).doc(id);
  const oppSnap = await oppRef.get();
  if (!oppSnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const opp = { id: oppSnap.id, ...oppSnap.data() } as OpportunityDoc;

  let body: { contextHint?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const contextHint = clean(body.contextHint, 4000);

  const privRef = adminDb
    .collection(COLLECTIONS.opportunityPrivate(uid, id))
    .doc("data");

  const prompt = buildPrompt(opp, contextHint);

  let briefText: string;
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    const client = getAnthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    inputTokens = response.usage.input_tokens;
    outputTokens = response.usage.output_tokens;
    briefText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!briefText) throw new Error("empty response from model");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "LLM call failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  logLlmCall({
    title: `Pipeline brief: ${opp.company}`,
    description: `${opp.company} — ${opp.role}${contextHint ? ` (context: ${contextHint.slice(0, 80)})` : ""}`,
    model: MODEL,
    inputTokens,
    outputTokens,
  });

  const brief: Brief = {
    content: briefText,
    generatedAt: Date.now(),
    model: MODEL,
    contextHint,
  };
  await privRef.set({ brief }, { merge: true });

  return NextResponse.json({ ok: true, brief, inputTokens, outputTokens });
}

/** Manually edit the brief content (user-edited markdown). */
export async function PATCH(req: Request, ctx: Ctx) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const content = clean(body.content, 50000);
  if (content === null) return NextResponse.json({ error: "content required" }, { status: 400 });

  const privRef = adminDb
    .collection(COLLECTIONS.opportunityPrivate(uid, id))
    .doc("data");
  const snap = await privRef.get();
  if (!snap.exists) return NextResponse.json({ error: "no brief to edit" }, { status: 404 });
  const data = snap.data() as Partial<OpportunityPrivateDoc>;
  if (!data.brief) return NextResponse.json({ error: "no brief to edit" }, { status: 404 });

  const next: Brief = { ...data.brief, content, generatedAt: Date.now() };
  await privRef.update({ brief: next });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const privRef = adminDb
    .collection(COLLECTIONS.opportunityPrivate(uid, id))
    .doc("data");
  await privRef.update({ brief: FieldValue.delete() });
  return NextResponse.json({ ok: true });
}
