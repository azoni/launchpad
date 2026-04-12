// Firestore rejects `undefined` field values. This strips them from any
// object before it goes to setDoc/writeBatch. Converts undefined → null.

export function sanitize<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === undefined ? null : v;
  }
  return out as T;
}
