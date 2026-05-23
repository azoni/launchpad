import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyUid } from "@/lib/api/auth";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { eventId?: string; dismissed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!body.eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const ref = adminDb.collection(COLLECTIONS.events(uid)).doc(body.eventId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });

  await ref.update({ dismissedAsInterview: body.dismissed !== false });
  return NextResponse.json({ ok: true });
}
