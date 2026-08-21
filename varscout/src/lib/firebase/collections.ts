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

/**
 * Short trailing series used to seed a browser's tick buffer on first load, so
 * a new visitor sees volume and momentum immediately instead of waiting minutes
 * for their own samples. Kept in its own document: folded into `current` it
 * would push that doc toward Firestore's 1MB ceiling as markets accumulate.
 */
export const STATS_SEED = "seed";

/** Trailing samples per market in the seed doc. At 5-minute polling, 48 ≈ 4h. */
export const SEED_CAP = 48;

/** Packed point-in-time snapshots, retained for later backtesting. */
export const SNAPSHOTS = "snapshots";

/** Collector run log — last run time, market counts, errors. */
export const META = "meta";
export const META_COLLECTOR = "collector";

/** Snapshots older than this are pruned by the collector. */
export const SNAPSHOT_RETENTION_DAYS = 30;

/** Only markets above this 24h volume are persisted, to bound document size. */
export const MIN_STORE_VOLUME = 250_000;
