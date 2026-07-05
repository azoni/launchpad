/**
 * In-memory sliding-window rate limiter (per warm serverless instance). Cheap and
 * dependency-free — good enough to stop one client hammering an endpoint. For a hard
 * cross-instance ceiling, pair it with the Firestore daily cap in the coach route.
 */
const buckets = new Map<string, number[]>();
let lastSweep = 0;

/** Returns true if the call is ALLOWED, false if it should be blocked. */
export function allow(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();

  // Periodic cleanup so the map can't grow unbounded.
  if (now - lastSweep > windowMs) {
    for (const [k, arr] of buckets) {
      const kept = arr.filter((t) => now - t < windowMs);
      if (kept.length) buckets.set(k, kept);
      else buckets.delete(k);
    }
    lastSweep = now;
  }

  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  return true;
}
