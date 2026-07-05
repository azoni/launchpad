/**
 * Aggregates public activity stats (AI-coach usage/cost + affiliate clicks) from
 * Firestore for the /stats dashboard and /api/stats endpoint. Read-only; degrades
 * to an empty (configured:false) payload when Firebase isn't set up.
 */
import type { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

// Bounded so a single dashboard load reads a modest number of docs (Firestore
// bills per doc read; keep the free-tier daily quota comfortable).
const CHAT_LIMIT = 300;
const CLICK_LIMIT = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface StatsData {
  configured: boolean;
  /** false when a Firestore read failed (e.g. daily read quota) — 0s are unknown, not real. */
  readOk: boolean;
  generatedAt: string;
  chats: {
    totalCalls: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    totalCostUSD: number;
    last24h: { calls: number; costUSD: number };
    last7d: { calls: number; costUSD: number };
    byModel: { model: string; calls: number; tokens: number; costUSD: number }[];
    recent: {
      prompt: string;
      model: string;
      tokens: number;
      costUSD: number;
      ts: string | null;
    }[];
  };
  affiliate: {
    totalClicks: number;
    last7d: number;
    byProduct: { slug: string; clicks: number }[];
    bySource: { source: string; clicks: number }[];
    recent: { slug: string; asin: string | null; source: string; ts: string | null }[];
  };
}

/** Never let a slow/hanging Firestore call time out the whole function. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("firestore-timeout")), ms),
    ),
  ]);
}

function toIso(ts: unknown): string | null {
  const t = ts as Timestamp | undefined;
  try {
    return t?.toDate ? t.toDate().toISOString() : null;
  } catch {
    return null;
  }
}

function round(n: number, dp = 4): number {
  return Number(n.toFixed(dp));
}

function emptyStats(configured: boolean): StatsData {
  return {
    configured,
    readOk: true,
    generatedAt: new Date().toISOString(),
    chats: {
      totalCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      totalCostUSD: 0,
      last24h: { calls: 0, costUSD: 0 },
      last7d: { calls: 0, costUSD: 0 },
      byModel: [],
      recent: [],
    },
    affiliate: { totalClicks: 0, last7d: 0, byProduct: [], bySource: [], recent: [] },
  };
}

export async function getStats(): Promise<StatsData> {
  const db = getAdminDb();
  if (!db) return emptyStats(false);

  const now = Date.now();
  const out = emptyStats(true);

  // ---- AI coach usage ----
  try {
    const snap = await withTimeout(
      db.collection(COLLECTIONS.chatLogs).orderBy("ts", "desc").limit(CHAT_LIMIT).get(),
      8000,
    );

    const byModel = new Map<string, { calls: number; tokens: number; costUSD: number }>();
    for (const doc of snap.docs) {
      const d = doc.data();
      const input = Number(d.inputTokens ?? 0);
      const output = Number(d.outputTokens ?? 0);
      const tokens = Number(d.totalTokens ?? input + output);
      const cost = Number(d.costUSD ?? 0);
      const iso = toIso(d.ts);
      const ageMs = iso ? now - new Date(iso).getTime() : Infinity;

      out.chats.totalCalls += 1;
      out.chats.inputTokens += input;
      out.chats.outputTokens += output;
      out.chats.totalTokens += tokens;
      out.chats.totalCostUSD += cost;
      if (ageMs <= DAY_MS) {
        out.chats.last24h.calls += 1;
        out.chats.last24h.costUSD += cost;
      }
      if (ageMs <= 7 * DAY_MS) {
        out.chats.last7d.calls += 1;
        out.chats.last7d.costUSD += cost;
      }

      const model = String(d.model ?? "unknown");
      const m = byModel.get(model) ?? { calls: 0, tokens: 0, costUSD: 0 };
      m.calls += 1;
      m.tokens += tokens;
      m.costUSD += cost;
      byModel.set(model, m);

      if (out.chats.recent.length < 50) {
        out.chats.recent.push({
          prompt: String(d.prompt ?? ""),
          model,
          tokens,
          costUSD: round(cost, 6),
          ts: iso,
        });
      }
    }
    out.chats.totalCostUSD = round(out.chats.totalCostUSD, 6);
    out.chats.last24h.costUSD = round(out.chats.last24h.costUSD, 6);
    out.chats.last7d.costUSD = round(out.chats.last7d.costUSD, 6);
    out.chats.byModel = [...byModel.entries()]
      .map(([model, v]) => ({ model, ...v, costUSD: round(v.costUSD, 6) }))
      .sort((a, b) => b.calls - a.calls);
  } catch {
    out.readOk = false; // e.g. Firestore daily read quota
  }

  // ---- Affiliate clicks ----
  try {
    const snap = await withTimeout(
      db
        .collection(COLLECTIONS.affiliateClicks)
        .orderBy("ts", "desc")
        .limit(CLICK_LIMIT)
        .get(),
      8000,
    );

    const byProduct = new Map<string, number>();
    const bySource = new Map<string, number>();
    for (const doc of snap.docs) {
      const d = doc.data();
      const slug = String(d.slug ?? "unknown");
      const source = String(d.source ?? "unknown");
      const iso = toIso(d.ts);
      const ageMs = iso ? now - new Date(iso).getTime() : Infinity;

      out.affiliate.totalClicks += 1;
      if (ageMs <= 7 * DAY_MS) out.affiliate.last7d += 1;
      byProduct.set(slug, (byProduct.get(slug) ?? 0) + 1);
      bySource.set(source, (bySource.get(source) ?? 0) + 1);

      if (out.affiliate.recent.length < 50) {
        out.affiliate.recent.push({
          slug,
          asin: d.asin ?? null,
          source,
          ts: iso,
        });
      }
    }
    out.affiliate.byProduct = [...byProduct.entries()]
      .map(([slug, clicks]) => ({ slug, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 25);
    out.affiliate.bySource = [...bySource.entries()]
      .map(([source, clicks]) => ({ source, clicks }))
      .sort((a, b) => b.clicks - a.clicks);
  } catch {
    out.readOk = false; // e.g. Firestore daily read quota
  }

  return out;
}
