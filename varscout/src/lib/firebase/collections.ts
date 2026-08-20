/**
 * Firestore layout.
 *
 * Only the server touches Firestore — the browser reads history through the
 * cached /api/aggregates route, so N visitors cost ~1 read per cache window
 * instead of one read each. Security rules deny all client access.
 */

/** Rolling per-market accumulators. One document, rewritten each collector run. */
export const STATS = "stats";
export const STATS_CURRENT = "current";

/** Packed point-in-time snapshots, retained for later backtesting. */
export const SNAPSHOTS = "snapshots";

/** Collector run log — last run time, market counts, errors. */
export const META = "meta";
export const META_COLLECTOR = "collector";

/** Snapshots older than this are pruned by the collector. */
export const SNAPSHOT_RETENTION_DAYS = 30;

/** Only markets above this 24h volume are persisted, to bound document size. */
export const MIN_STORE_VOLUME = 250_000;
