import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { allow } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Newsletter opt-in. Stores one doc per email (id = lowercased email) so repeat
 * signups are idempotent. Degrades gracefully when Firebase isn't configured.
 */
export async function POST(req: Request) {
  if (!allow("subscribe", 60)) return json({ error: "slow down" }, 429);

  const b = (await req.json().catch(() => ({}))) as {
    email?: string;
    source?: string;
    action?: string;
  };
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 200) {
    return json({ error: "Enter a valid email." }, 400);
  }

  const db = getAdminDb();
  if (!db) return json({ error: "Signups aren't available right now." }, 503);

  const unsubscribe = b.action === "unsubscribe";
  try {
    if (unsubscribe) {
      await db
        .collection(COLLECTIONS.subscribers)
        .doc(email)
        .set(
          { status: "unsubscribed", unsubscribedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
    } else {
      await db.collection(COLLECTIONS.subscribers).doc(email).set(
        {
          email,
          source: String(b.source ?? "site").slice(0, 40),
          status: "active",
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
  } catch {
    return json({ error: "Could not process that — try again." }, 500);
  }
  return json({ ok: true });
}
