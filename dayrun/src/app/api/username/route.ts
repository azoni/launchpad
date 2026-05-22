import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type UserDoc } from "@/lib/firebase/collections";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,23}$/;
const RESERVED = new Set([
  "admin", "api", "app", "settings", "u", "about", "privacy", "explore",
  "robots", "sitemap", "manifest", "icon", "opengraph-image",
  "_next", "static", "public",
]);

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

  let body: { username?: string; publicProfile?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const username = (body.username ?? "").toLowerCase().trim();
  if (!USERNAME_RE.test(username) || RESERVED.has(username)) {
    return NextResponse.json({ error: "invalid or reserved username" }, { status: 400 });
  }
  const publicProfile = body.publicProfile !== false;

  const usernameRef = adminDb.collection(COLLECTIONS.usernames).doc(username);
  const userRef = adminDb.collection(COLLECTIONS.users).doc(uid);

  try {
    await adminDb.runTransaction(async (tx) => {
      const [usernameSnap, userSnap] = await Promise.all([
        tx.get(usernameRef),
        tx.get(userRef),
      ]);

      if (usernameSnap.exists) {
        const owner = (usernameSnap.data() as { uid?: string }).uid;
        if (owner !== uid) {
          throw new Error("username taken");
        }
      }

      // Release previous username if user is changing it.
      const prev = userSnap.exists ? (userSnap.data() as UserDoc) : null;
      if (prev?.username && prev.username !== username) {
        tx.delete(adminDb.collection(COLLECTIONS.usernames).doc(prev.username));
      }

      tx.set(usernameRef, { uid });

      if (userSnap.exists) {
        tx.update(userRef, { username, publicProfile });
      } else {
        const fbUser = await adminAuth.getUser(uid);
        const initial: UserDoc = {
          email: fbUser.email ?? "",
          displayName: fbUser.displayName ?? null,
          photoURL: fbUser.photoURL ?? null,
          username,
          publicProfile,
          createdAt: Date.now(),
          lastSyncedAt: null,
        };
        tx.set(userRef, initial);
      }
    });
    return NextResponse.json({ ok: true, username });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "save failed";
    const status = msg === "username taken" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
