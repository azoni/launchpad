import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { fetchEvents } from "@/lib/google/calendar";
import { COLLECTIONS, type EventDoc, type UserDoc } from "@/lib/firebase/collections";
import { FieldValue } from "firebase-admin/firestore";
import { planAutoLinks, applyAutoLinks } from "@/lib/auto-link";

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

  let body: { accessToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!body.accessToken) {
    return NextResponse.json({ error: "accessToken required" }, { status: 400 });
  }

  let events;
  try {
    events = await fetchEvents(body.accessToken, { back: 30, forward: 30 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "calendar fetch failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Ensure user doc exists (first sync = bootstrap profile).
  const userRef = adminDb.collection(COLLECTIONS.users).doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    const fbUser = await adminAuth.getUser(uid);
    const initial: UserDoc = {
      email: fbUser.email ?? "",
      displayName: fbUser.displayName ?? null,
      photoURL: fbUser.photoURL ?? null,
      username: null,
      publicProfile: true,
      createdAt: Date.now(),
      lastSyncedAt: null,
    };
    await userRef.set(initial);
  }

  // Upsert each event, preserving isPublic if already set.
  const batch = adminDb.batch();
  const eventsCol = adminDb.collection(COLLECTIONS.events(uid));
  const now = Date.now();

  // Load existing isPublic flags for the events we're about to upsert.
  const existingDocs = await Promise.all(
    events.map((ev) => eventsCol.doc(ev.googleEventId).get()),
  );
  const existing = new Map<string, EventDoc>();
  for (const snap of existingDocs) {
    if (snap.exists) existing.set(snap.id, snap.data() as EventDoc);
  }

  for (const ev of events) {
    const prev = existing.get(ev.googleEventId);
    const doc: EventDoc = {
      googleEventId: ev.googleEventId,
      summary: ev.summary,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      timeZone: ev.timeZone ?? prev?.timeZone ?? null,
      location: ev.location,
      description: ev.description,
      isPublic: prev?.isPublic ?? false,
      syncedAt: now,
      source: "google",
      opportunityId: prev?.opportunityId ?? null,
      dismissedAsInterview: prev?.dismissedAsInterview ?? false,
      attendeeDomain: ev.attendeeDomain,
    };
    batch.set(eventsCol.doc(ev.googleEventId), doc);
  }
  batch.update(userRef, { lastSyncedAt: FieldValue.serverTimestamp() });

  await batch.commit();
  await userRef.update({ lastSyncedAt: now });

  // Auto-link new events to opportunities by title match.
  const plans = await planAutoLinks(adminDb, uid);
  await applyAutoLinks(adminDb, uid, plans);

  return NextResponse.json({ ok: true, count: events.length, linked: plans.length });
}
