/**
 * Smoke-test the collector's credential path: decode the service account the
 * same way the app does, write a doc, read it back, delete it.
 * Run with: node --env-file=.env.local scripts/verify-firestore.mjs
 */
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");

const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
const sa = JSON.parse(text);
console.log("decoded service account:", sa.client_email);

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa) });
const db = getFirestore(app);
db.settings({ preferRest: true });

const ref = db.collection("meta").doc("_smoketest");
const stamp = Date.now();
await ref.set({ stamp, note: "varscout credential check" });
const back = (await ref.get()).data();
console.log("write+read round trip:", back?.stamp === stamp ? "OK" : "MISMATCH");
await ref.delete();
console.log("cleanup: deleted");
process.exit(0);
