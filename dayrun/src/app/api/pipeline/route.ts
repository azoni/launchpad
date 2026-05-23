import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUid } from "@/lib/api/auth";
import {
  COLLECTIONS,
  OPPORTUNITY_STATUSES,
  type OpportunityDoc,
  type OpportunityStatus,
} from "@/lib/firebase/collections";
import { planAutoLinks, applyAutoLinks } from "@/lib/auto-link";

export const runtime = "nodejs";

function sanitizeStatus(s: unknown): OpportunityStatus {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(s as string)
    ? (s as OpportunityStatus)
    : "applied";
}

function clean(s: unknown, max = 2000): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim().slice(0, max);
  return t.length === 0 ? null : t;
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
  const doc: OpportunityDoc = {
    id: ref.id,
    company,
    role,
    status: sanitizeStatus(body.status),
    source: clean(body.source, 500),
    link: clean(body.link, 1000),
    nextStep: clean(body.nextStep, 500),
    nextStepBy: clean(body.nextStepBy, 40),
    isPublic: body.isPublic === true,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(doc);
  // Initialize empty private doc so future PATCHes don't need to create it.
  await adminDb
    .collection(COLLECTIONS.opportunityPrivate(uid, ref.id))
    .doc("data")
    .set({ notes: "", feedback: "", contacts: [] });

  // Auto-link any matching events.
  const plans = await planAutoLinks(adminDb, uid);
  await applyAutoLinks(adminDb, uid, plans);

  return NextResponse.json({ ok: true, opportunity: doc, linkedEvents: plans.length });
}
