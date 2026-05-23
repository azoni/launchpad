import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUid } from "@/lib/api/auth";
import {
  COLLECTIONS,
  type OpportunityDoc,
  type OpportunityPrivateDoc,
} from "@/lib/firebase/collections";
import { getAnthropic, logLlmCall } from "@/lib/llm/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const MODEL = "claude-sonnet-4-6";

function buildPrompt(opp: OpportunityDoc, existingNotes: string): string {
  return [
    `You're helping a senior engineer prep for a job interview. Generate a tight, scannable prep brief in markdown.`,
    ``,
    `Company: ${opp.company}`,
    `Role: ${opp.role}`,
    opp.source ? `Source / how I got in: ${opp.source}` : "",
    `Current stage: ${opp.status}`,
    opp.nextStep ? `Next step: ${opp.nextStep}${opp.nextStepBy ? ` (${opp.nextStepBy})` : ""}` : "",
    existingNotes ? `\nExisting notes:\n"""\n${existingNotes.slice(0, 4000)}\n"""` : "",
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

export async function POST(req: Request, ctx: Ctx) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const oppRef = adminDb.collection(COLLECTIONS.opportunities(uid)).doc(id);
  const oppSnap = await oppRef.get();
  if (!oppSnap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const opp = { id: oppSnap.id, ...oppSnap.data() } as OpportunityDoc;

  const privRef = adminDb
    .collection(COLLECTIONS.opportunityPrivate(uid, id))
    .doc("data");
  const privSnap = await privRef.get();
  const priv = privSnap.exists
    ? (privSnap.data() as Partial<OpportunityPrivateDoc>)
    : { notes: "" };
  const existingNotes = priv.notes ?? "";

  const prompt = buildPrompt(opp, existingNotes);

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
    description: `${opp.company} — ${opp.role}`,
    model: MODEL,
    inputTokens,
    outputTokens,
  });

  const header = `## Prep brief — generated ${new Date().toISOString().slice(0, 10)}`;
  const next =
    existingNotes.trim().length === 0
      ? `${header}\n\n${briefText}`
      : `${existingNotes.trim()}\n\n---\n\n${header}\n\n${briefText}`;

  await privRef.set({ notes: next }, { merge: true });

  return NextResponse.json({
    ok: true,
    inputTokens,
    outputTokens,
    appended: existingNotes.trim().length > 0,
  });
}
