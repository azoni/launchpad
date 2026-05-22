import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export const runtime = "nodejs";

async function verifyUid(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { eventId?: string; isPublic?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!body.eventId || typeof body.isPublic !== "boolean") {
    return NextResponse.json({ error: "eventId and isPublic required" }, { status: 400 });
  }

  const ref = adminDb.collection(COLLECTIONS.events(uid)).doc(body.eventId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "not found" }, { status: 404 });

  await ref.update({ isPublic: body.isPublic });
  return NextResponse.json({ ok: true });
}
