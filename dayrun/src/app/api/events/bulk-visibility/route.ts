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

const MAX_IDS = 500;

export async function POST(req: Request) {
  const uid = await verifyUid(req);
  if (!uid) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { ids?: string[]; isPublic?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || typeof body.isPublic !== "boolean") {
    return NextResponse.json({ error: "ids[] and isPublic required" }, { status: 400 });
  }
  if (body.ids.length === 0) return NextResponse.json({ ok: true, count: 0 });
  if (body.ids.length > MAX_IDS) {
    return NextResponse.json({ error: `too many ids (>${MAX_IDS})` }, { status: 400 });
  }

  const col = adminDb.collection(COLLECTIONS.events(uid));
  // Firestore batches cap at 500 ops; we already cap inputs at MAX_IDS.
  const batch = adminDb.batch();
  for (const id of body.ids) {
    if (typeof id !== "string" || !id) continue;
    batch.update(col.doc(id), { isPublic: body.isPublic });
  }
  await batch.commit();
  return NextResponse.json({ ok: true, count: body.ids.length });
}
