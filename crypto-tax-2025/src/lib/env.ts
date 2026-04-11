// Typed access to import.meta.env values.
// Throws loudly at startup if a required client var is missing — better than
// a confusing Firebase init error 5 layers down.

function required(key: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    // eslint-disable-next-line no-console
    console.warn(`[env] Missing required env var: ${key}`);
    return "";
  }
  return value;
}

export const FIREBASE_CONFIG = {
  apiKey: required("VITE_FIREBASE_API_KEY", import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: required("VITE_FIREBASE_AUTH_DOMAIN", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: required("VITE_FIREBASE_PROJECT_ID", import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: required("VITE_FIREBASE_STORAGE_BUCKET", import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: required("VITE_FIREBASE_MESSAGING_SENDER_ID", import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: required("VITE_FIREBASE_APP_ID", import.meta.env.VITE_FIREBASE_APP_ID),
};

export const ALLOWED_UID: string = (import.meta.env.VITE_ALLOWED_UID ?? "").trim();
