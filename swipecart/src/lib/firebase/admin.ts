import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  }
  return JSON.parse(raw) as ServiceAccount;
}

const app =
  getApps().length === 0
    ? initializeApp({ credential: cert(getServiceAccount()) })
    : getApps()[0];

const adminDb = getFirestore(app);

export { adminDb };
