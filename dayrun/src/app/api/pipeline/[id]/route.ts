import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUid } from "@/lib/api/auth";
import {
  COLLECTIONS,
  OPPORTUNITY_STATUSES,
  type OpportunityDoc,
  type OpportunityStatus,
  type Contact,
} from "@/lib/firebase/collections";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

function sanitizeStatus(s: unknown): OpportunityStatus | undefined {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(s as string)
    ? (s as OpportunityStatus)
    : undefined;
}

function clean(s: unknown, max = 2000): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().slice(0, max);
  return t.length === 0 ? null : t;
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
  if ("isPublic" in body) safeUpdate.isPublic = body.isPublic === true;

  await ref.update(safeUpdate);

  // Private fields go to the subcollection doc.
  const privateUpdate: Record<string, unknown> = {};
  if ("notes" in body) privateUpdate.notes = clean(body.notes, 20000) ?? "";
  if ("feedback" in body) privateUpdate.feedback = clean(body.feedback, 20000) ?? "";
  if ("contacts" in body) {
    const c = sanitizeContacts(body.contacts);
    if (c) privateUpdate.contacts = c;
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
