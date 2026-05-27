import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
} from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function getServiceAccount(): ServiceAccount {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (b64) {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8")) as ServiceAccount;
  }
  if (raw) {
    return JSON.parse(raw) as ServiceAccount;
  }
  throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY_B64 or FIREBASE_SERVICE_ACCOUNT_KEY is not set");
}

const app =
  getApps().length === 0
    ? initializeApp({ credential: cert(getServiceAccount()) })
    : getApps()[0];

const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
const adminFieldValue = FieldValue;

export { adminDb, adminAuth, adminFieldValue };
