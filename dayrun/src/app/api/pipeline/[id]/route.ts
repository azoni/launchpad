import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUid } from "@/lib/api/auth";
import {
  COLLECTIONS,
  INTERVIEW_ROUND_OUTCOMES,
  LOCATION_TYPES,
  OPPORTUNITY_STATUSES,
  type EventDoc,
  type InterviewRound,
  type InterviewRoundOutcome,
  type ChecklistItem,
  type Compensation,
  type LocationType,
  type OpportunityDoc,
  type OpportunityStatus,
  type Contact,
} from "@/lib/firebase/collections";
import { refreshOpportunityTimingFromEvents } from "@/lib/auto-link";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function sanitizeStatus(s: unknown): OpportunityStatus | undefined {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(s as string)
    ? (s as OpportunityStatus)
    : undefined;
}

function sanitizeLocation(s: unknown): LocationType | null | undefined {
  if (s === null || s === "") return null;
  return (LOCATION_TYPES as readonly string[]).includes(s as string)
    ? (s as LocationType)
    : undefined;
}

function sanitizeChecklist(c: unknown): ChecklistItem[] | undefined {
  if (!Array.isArray(c)) return undefined;
  return c
    .map((entry): ChecklistItem | null => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Record<string, unknown>;
      const id = typeof e.id === "string" ? e.id.slice(0, 60) : null;
      const text = typeof e.text === "string" ? e.text.trim().slice(0, 500) : null;
      if (!id || !text) return null;
      return { id, text, done: e.done === true };
    })
    .filter((x): x is ChecklistItem => x !== null)
    .slice(0, 100);
}

function sanitizeCompensation(c: unknown): Compensation | undefined {
  if (!c || typeof c !== "object") return undefined;
  const obj = c as Record<string, unknown>;
  const safe = (v: unknown) =>
    typeof v === "string" ? v.trim().slice(0, 500) : "";
  return {
    base: safe(obj.base),
    equity: safe(obj.equity),
    other: safe(obj.other),
  };
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

function sanitizePlannedRounds(v: unknown): number | null | undefined {
  if (v === null || v === "") return null;
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string" && v.trim()
        ? Number(v)
        : NaN;
  if (!Number.isFinite(n)) return undefined;
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

function sanitizeInterviewRounds(value: unknown): InterviewRound[] | undefined {
  if (!Array.isArray(value)) return undefined;
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

function sanitizeContacts(c: unknown): Contact[] | undefined {
  if (!Array.isArray(c)) return undefined;
  return c
    .map((entry): Contact | null => {
      if (!entry || typeof entry !== "object") return null;
      const e = entry as Record<string, unknown>;
      const name = clean(e.name, 200);
      if (!name) return null;
      return {
        name,
        role: clean(e.role, 200) ?? "",
        note: clean(e.note, 1000) ?? "",
      };
    })
    .filter((x): x is Contact => x !== null)
    .slice(0, 50);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const ref = adminDb.collection(COLLECTIONS.opportunities(uid)).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });
  const currentOpp = { id: snap.id, ...(snap.data() as Omit<OpportunityDoc, "id">) };

  // Build update objects (only set keys present in body).
  const safeUpdate: Partial<OpportunityDoc> = { updatedAt: Date.now() };
  if ("company" in body) {
    const v = clean(body.company, 200);
    if (!v) return NextResponse.json({ error: "company can't be empty" }, { status: 400 });
    safeUpdate.company = v;
  }
  if ("role" in body) {
    const v = clean(body.role, 200);
    if (!v) return NextResponse.json({ error: "role can't be empty" }, { status: 400 });
    safeUpdate.role = v;
  }
  if ("status" in body) {
    const v = sanitizeStatus(body.status);
    if (v) safeUpdate.status = v;
  }
  if ("source" in body) safeUpdate.source = clean(body.source, 500);
  if ("link" in body) safeUpdate.link = clean(body.link, 1000);
  if ("nextStep" in body) safeUpdate.nextStep = clean(body.nextStep, 500);
  if ("nextStepBy" in body) safeUpdate.nextStepBy = clean(body.nextStepBy, 40);
  if ("firstRoundAt" in body) safeUpdate.firstRoundAt = cleanDate(body.firstRoundAt);
  if ("nextRoundAt" in body) safeUpdate.nextRoundAt = cleanDate(body.nextRoundAt);
  if ("plannedRounds" in body) {
    const v = sanitizePlannedRounds(body.plannedRounds);
    if (v !== undefined) safeUpdate.plannedRounds = v;
  }
  if ("interviewRounds" in body) {
    const rounds = sanitizeInterviewRounds(body.interviewRounds);
    if (rounds) safeUpdate.interviewRounds = rounds;
  }
  if ("locationType" in body) {
    const v = sanitizeLocation(body.locationType);
    if (v !== undefined) safeUpdate.locationType = v;
  }
  const isPublicChanging = "isPublic" in body;
  const newIsPublic = body.isPublic === true;
  if (isPublicChanging) safeUpdate.isPublic = newIsPublic;

  const linkedEventIds = sanitizeLinkedEventIds(body.linkedEventIds);
  const eventSnaps =
    linkedEventIds.length > 0
      ? await Promise.all(
          linkedEventIds.map((eventId) =>
            adminDb.collection(COLLECTIONS.events(uid)).doc(eventId).get(),
          ),
        )
      : [];
  const missingEvent = eventSnaps.find((eventSnap) => !eventSnap.exists);
  if (missingEvent) {
    return NextResponse.json(
      { error: `event not found: ${missingEvent.id}` },
      { status: 404 },
    );
  }

  await ref.update(safeUpdate);

  if (eventSnaps.length > 0) {
    const batch = adminDb.batch();
    const affectedOpportunityIds = new Set<string>([id]);
    const linkedIsPublic = isPublicChanging ? newIsPublic : currentOpp.isPublic;

    for (const eventSnap of eventSnaps) {
      const event = eventSnap.data() as EventDoc;
      if (event.opportunityId && event.opportunityId !== id) {
        affectedOpportunityIds.add(event.opportunityId);
      }
      batch.update(eventSnap.ref, {
        opportunityId: id,
        isPublic: linkedIsPublic,
      });
    }

    await batch.commit();
    await refreshOpportunityTimingFromEvents(adminDb, uid, [...affectedOpportunityIds]);
  }

  // Cascade visibility to all linked events when the pipeline item's public flag changes.
  // Public pipeline item → linked events public. Private → linked events private. Per-event
  // overrides are washed away by an explicit pipeline toggle (intentional: pipeline is the
  // primary unit of "show people what I'm doing").
  if (isPublicChanging) {
    const linked = await adminDb
      .collection(COLLECTIONS.events(uid))
      .where("opportunityId", "==", id)
      .get();
    if (!linked.empty) {
      const batch = adminDb.batch();
      for (const ev of linked.docs) {
        batch.update(ev.ref, { isPublic: newIsPublic });
      }
      await batch.commit();
    }
  }

  // Private fields go to the subcollection doc.
  const privateUpdate: Record<string, unknown> = {};
  if ("notes" in body) privateUpdate.notes = clean(body.notes, 20000) ?? "";
  if ("feedback" in body) privateUpdate.feedback = clean(body.feedback, 20000) ?? "";
  if ("contacts" in body) {
    const c = sanitizeContacts(body.contacts);
    if (c) privateUpdate.contacts = c;
  }
  if ("compensation" in body) {
    const c = sanitizeCompensation(body.compensation);
    if (c) privateUpdate.compensation = c;
  }
  if ("checklist" in body) {
    const c = sanitizeChecklist(body.checklist);
    if (c) privateUpdate.checklist = c;
  }
  if (Object.keys(privateUpdate).length > 0) {
    await adminDb
      .collection(COLLECTIONS.opportunityPrivate(uid, id))
      .doc("data")
      .set(privateUpdate, { merge: true });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const ref = adminDb.collection(COLLECTIONS.opportunities(uid)).doc(id);
  // Unlink any events pointing here.
  const linked = await adminDb
    .collection(COLLECTIONS.events(uid))
    .where("opportunityId", "==", id)
    .get();
  const batch = adminDb.batch();
  for (const ev of linked.docs) batch.update(ev.ref, { opportunityId: null });
  // Delete private subdoc + main doc.
  batch.delete(
    adminDb.collection(COLLECTIONS.opportunityPrivate(uid, id)).doc("data"),
  );
  batch.delete(ref);
  await batch.commit();

  return NextResponse.json({ ok: true, unlinkedEvents: linked.size });
}
