/**
 * Firebase Admin (server-only) — OPTIONAL. Returns null when unconfigured so
 * the app runs locally with no Firebase project. Provisioned at deploy time.
 *
 * FIREBASE_SERVICE_ACCOUNT_KEY may be raw JSON or base64-encoded JSON (Next 16
 * won't reliably parse a JSON-wrapped key from an env var, so base64 is preferred).
 */

import {
  getApps,
  initializeApp,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let cached: Firestore | null | undefined;

function decodeServiceAccount(raw: string): ServiceAccount | null {
  const text = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
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
    const app: App = getApps().length
      ? getApps()[0]
      : initializeApp({ credential: cert(sa) });
    cached = getFirestore(app);
    return cached;
  } catch (e) {
    console.error("Firebase admin init failed:", e);
    cached = null;
    return cached;
  }
}
