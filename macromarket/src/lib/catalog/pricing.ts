/**
 * Live-price resolution layer.
 *
 * Live pricing is gated behind AMAZON_LIVE_PRICING="1" so we never waste
 * rate-limited API calls while the associate account is ineligible (403). The
 * moment the account is eligible, set that env var and real-time prices + deals
 * flow in automatically — no code change. Caches in-memory (per warm invocation)
 * and, when Firebase is configured, in Firestore `priceCache` (TTL 6h) to respect
 * Amazon's refresh rules and cut API calls.
 */

import { getItemsBatched } from "@/lib/amazon/client";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import type { LivePricing } from "./types";

const TTL_MS = 6 * 60 * 60 * 1000;
const mem = new Map<string, LivePricing>();

export function livePricingEnabled(): boolean {
  return process.env.AMAZON_LIVE_PRICING === "1";
}

function fresh(lp: LivePricing | undefined, now: number): lp is LivePricing {
  return !!lp && now - lp.fetchedAt < TTL_MS;
}

async function readFirestore(
  asins: string[],
  now: number,
): Promise<Map<string, LivePricing>> {
  const out = new Map<string, LivePricing>();
  const db = getAdminDb();
  if (!db || asins.length === 0) return out;
  try {
    const refs = asins.map((a) => db.collection(COLLECTIONS.priceCache).doc(a));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      const data = snap.data() as LivePricing | undefined;
      if (fresh(data, now)) out.set(snap.id, data);
    }
  } catch {
    /* ignore cache read errors */
  }
  return out;
}

async function writeFirestore(entries: Map<string, LivePricing>): Promise<void> {
  const db = getAdminDb();
  if (!db || entries.size === 0) return;
  try {
    const batch = db.batch();
    for (const [asin, lp] of entries) {
      batch.set(db.collection(COLLECTIONS.priceCache).doc(asin), lp, {
        merge: true,
      });
    }
    await batch.commit();
  } catch {
    /* ignore cache write errors */
  }
}

/** Resolve live pricing for the given ASINs. Empty map when disabled/ineligible. */
export async function getLivePricing(
  asins: string[],
): Promise<Map<string, LivePricing>> {
  const out = new Map<string, LivePricing>();
  if (!livePricingEnabled() || asins.length === 0) return out;

  const now = Date.now();
  const need: string[] = [];

  // 1) in-memory
  for (const asin of asins) {
    const c = mem.get(asin);
    if (fresh(c, now)) out.set(asin, c as LivePricing);
    else need.push(asin);
  }

  // 2) firestore
  if (need.length) {
    const fromDb = await readFirestore(need, now);
    for (const [asin, lp] of fromDb) {
      out.set(asin, lp);
      mem.set(asin, lp);
    }
  }
  const stillNeed = need.filter((a) => !out.has(a));

  // 3) live Amazon fetch (rate-limited, batched); degrades to nothing on 403
  if (stillNeed.length) {
    const fetched = await getItemsBatched(stillNeed);
    const freshEntries = new Map<string, LivePricing>();
    for (const [asin, p] of fetched) {
      const lp: LivePricing = {
        priceCents: p.priceCents,
        listPriceCents: p.listPriceCents,
        savingsPercent: p.savingsPercent,
        inStock: p.inStock,
        rating: p.rating,
        reviewCount: p.reviewCount,
        imageUrl: p.images[0] ?? null,
        fetchedAt: now,
      };
      mem.set(asin, lp);
      out.set(asin, lp);
      freshEntries.set(asin, lp);
    }
    void writeFirestore(freshEntries);
  }

  return out;
}
