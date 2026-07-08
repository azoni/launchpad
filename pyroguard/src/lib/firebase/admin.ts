import { initializeApp, getApps, cert, type ServiceAccount, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length > 0) {
    _app = getApps()[0]!;
    return _app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not set");
  const svc = JSON.parse(raw) as ServiceAccount;
  _app = initializeApp({ credential: cert(svc) });
  return _app;
}

// Proxy-style getters — defer init until first access so build-time
// "collect page data" passes without Firebase env vars present.
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_t, prop) {
    const actual = getFirestore(getAdminApp());
    const value = (actual as unknown as Record<string | symbol, unknown>)[prop as string | symbol];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(actual) : value;
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_t, prop) {
    const actual = getAuth(getAdminApp());
    const value = (actual as unknown as Record<string | symbol, unknown>)[prop as string | symbol];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(actual) : value;
  },
});
