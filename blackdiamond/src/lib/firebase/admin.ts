import { initializeApp, cert, getApps, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY env var is missing");
  }
  return JSON.parse(raw) as ServiceAccount;
}

let _db: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (_db) return _db;

  if (getApps().length === 0) {
    initializeApp({ credential: cert(getServiceAccount()) });
  }

  _db = getFirestore();
  return _db;
}
