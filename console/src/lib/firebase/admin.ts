import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set");

    if (!getApps().length) {
      initializeApp({ credential: cert(JSON.parse(key)) });
    }
    _db = getFirestore();
  }
  return _db;
}
