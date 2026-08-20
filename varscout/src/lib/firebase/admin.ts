/**
 * Firebase Admin (server-only) — OPTIONAL. Returns null when unconfigured so
 * the app still runs locally with no Firebase project; the UI just falls back
 * to snapshot-only scoring with everything marked provisional.
 *
 * FIREBASE_SERVICE_ACCOUNT_KEY may be raw JSON or base64-encoded JSON. Base64
 * is preferred — Next 16 won't reliably parse a JSON-wrapped key from an env var.
 */

import { getApps, initializeApp, cert, type App, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cached: Firestore | null | undefined;

function decodeServiceAccount(raw: string): ServiceAccount | null {
  const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  try {
    return JSON.parse(text) as ServiceAccount;
  } catch {
    return null;
  }
}

/** Firestore instance, or null when Firebase isn't configured. */
export function getAdminDb(): Firestore | null {
  if (cached !== undefined) return cached;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    cached = null;
    return cached;
  }
  const sa = decodeServiceAccount(raw);
  if (!sa) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY could not be parsed");
    cached = null;
    return cached;
  }
  try {
    const app: App = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa) });
    const db = getFirestore(app);
    // firebase-admin's default gRPC transport can hang (and time the function
    // out) in serverless runtimes like Netlify/Lambda. REST avoids it. Must be
    // set before the instance's first read/write — this is the only place
    // getFirestore is called, and we set it immediately, so that holds.
    try {
      db.settings({ preferRest: true });
    } catch {
      /* settings already applied on a reused instance — safe to ignore */
    }
    cached = db;
    return cached;
  } catch (e) {
    console.error("Firebase admin init failed:", e);
    cached = null;
    return cached;
  }
}
