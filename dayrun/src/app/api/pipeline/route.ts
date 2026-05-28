import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUid } from "@/lib/api/auth";
import {
  COLLECTIONS,
  INTERVIEW_ROUND_OUTCOMES,
  OPPORTUNITY_STATUSES,
  type InterviewRound,
  type InterviewRoundOutcome,
  type OpportunityDoc,
  type OpportunityStatus,
} from "@/lib/firebase/collections";
import { planAutoLinks, applyAutoLinks } from "@/lib/auto-link";

export const runtime = "nodejs";

function sanitizeStatus(s: unknown): OpportunityStatus {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(s as string)
    ? (s as OpportunityStatus)
    : "ongoing";
}

function clean(s: unknown, max = 2000): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().slice(0, max);
  return t.length === 0 ? null : t;
}

function cleanDate(s: unknown): string | null {
  const t = clean(s, 80);
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return Number.isFinite(Date.parse(t)) ? t : null;
}

function sanitizeRoundOutcome(v: unknown): InterviewRoundOutcome {
  return (INTERVIEW_ROUND_OUTCOMES as readonly string[]).includes(v as string)
    ? (v as InterviewRoundOutcome)
    : "scheduled";
}

function sanitizeRoundNumber(v: unknown, fallback: number): number {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string" && v.trim()
        ? Number(v)
        : fallback;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(99, Math.max(1, Math.trunc(n)));
}

function sanitizePlannedRounds(v: unknown): number | null {
  if (v === null || v === "") return null;
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string" && v.trim()
        ? Number(v)
        : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(12, Math.max(1, Math.trunc(n)));
}

function sanitizeLinkedEventIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  for (const entry of value) {
    const id = clean(entry, 300);
    if (id) ids.add(id);
  }
  return [...ids].slice(0, 20);
}

function sanitizeInterviewRounds(value: unknown): InterviewRound[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index): InterviewRound | null => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Record<string, unknown>;
      const title = clean(e.title, 120) ?? `Round ${index + 1}`;
      const id = clean(e.id, 80) ?? `round_${Date.now()}_${index}`;
      return {
        id,
        roundNumber: sanitizeRoundNumber(e.roundNumber, index + 1),
        title,
        scheduledAt: cleanDate(e.scheduledAt),
        outcome: sanitizeRoundOutcome(e.outcome),
        publicNote: clean(e.publicNote, 500),
        eventId: clean(e.eventId, 200),
      };
    })
    .filter((x): x is InterviewRound => x !== null)
    .slice(0, 20);
}

export async function POST(req: Request) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const company = clean(body.company, 200);
  const role = clean(body.role, 200);
  if (!company || !role) {
    return NextResponse.json({ error: "company and role required" }, { status: 400 });
  }

  const now = Date.now();
  const ref = adminDb.collection(COLLECTIONS.opportunities(uid)).doc();
  const linkedEventIds = sanitizeLinkedEventIds(body.linkedEventIds);
  const doc: OpportunityDoc = {
    id: ref.id,
    company,
    role,
    status: sanitizeStatus(body.status),
    source: clean(body.source, 500),
    link: clean(body.link, 1000),
    nextStep: clean(body.nextStep, 500),
    nextStepBy: clean(body.nextStepBy, 40),
    firstRoundAt: cleanDate(body.firstRoundAt),
    nextRoundAt: cleanDate(body.nextRoundAt),
    plannedRounds: sanitizePlannedRounds(body.plannedRounds),
    interviewRounds: sanitizeInterviewRounds(body.interviewRounds),
    // Public by default — users opted into a public profile, the friction belongs on hiding, not sharing.
    isPublic: body.isPublic !== false,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(doc);
  // Initialize empty private doc so future PATCHes don't need to create it.
  await adminDb
    .collection(COLLECTIONS.opportunityPrivate(uid, ref.id))
    .doc("data")
    .set({ notes: "", feedback: "", contacts: [] });

  if (linkedEventIds.length > 0) {
    const batch = adminDb.batch();
    const eventsCol = adminDb.collection(COLLECTIONS.events(uid));
    for (const eventId of linkedEventIds) {
      batch.update(eventsCol.doc(eventId), {
        opportunityId: ref.id,
        isPublic: doc.isPublic,
      });
    }
    await batch.commit();
  }

  // Auto-link any matching events.
  const plans = await planAutoLinks(adminDb, uid);
  await applyAutoLinks(adminDb, uid, plans);

  // If the new pipeline item is public, flip any newly-linked events to match.
  if (doc.isPublic && plans.length > 0) {
    const batch = adminDb.batch();
    const eventsCol = adminDb.collection(COLLECTIONS.events(uid));
    for (const p of plans.filter((p) => p.opportunityId === ref.id)) {
      batch.update(eventsCol.doc(p.eventDocId), { isPublic: true });
    }
    await batch.commit();
  }

  return NextResponse.json({
    ok: true,
    opportunity: doc,
    linkedEvents: linkedEventIds.length + plans.length,
  });
}
