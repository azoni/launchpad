import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUid } from "@/lib/api/auth";
import {
  COLLECTIONS,
  ROUND_OUTCOMES,
  type EventNotesDoc,
  type RoundOutcome,
} from "@/lib/firebase/collections";

export const runtime = "nodejs";

function sanitizeOutcome(v: unknown): RoundOutcome | undefined {
  return (ROUND_OUTCOMES as readonly string[]).includes(v as string)
    ? (v as RoundOutcome)
    : undefined;
}

function clean(s: unknown, max = 2000): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().slice(0, max);
  return t.length === 0 ? null : t;
}

export async function PUT(req: Request) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId : null;
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  // Ensure the parent event actually exists for this user.
  const eventRef = adminDb.collection(COLLECTIONS.events(uid)).doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) return NextResponse.json({ error: "event not found" }, { status: 404 });

  const notesRef = adminDb.collection(COLLECTIONS.eventNotes(uid)).doc(eventId);
  const update: Partial<EventNotesDoc> = { updatedAt: Date.now() };
  if ("roundName" in body) update.roundName = clean(body.roundName, 100);
  if ("outcome" in body) {
    const o = sanitizeOutcome(body.outcome);
    if (o) update.outcome = o;
  }
  if ("notes" in body) update.notes = clean(body.notes, 10000) ?? "";

  await notesRef.set(update, { merge: true });
  return NextResponse.json({ ok: true });
}
