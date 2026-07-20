/**
 * Admin daily-poster API.
 *
 * GET  → everything the composer needs in one call: compact catalog (with live
 *        prices), published posts, today's suggested picks, recent post history.
 * POST → { action: "posted" }  record a posted card in Firestore `socialPosts`
 *        { action: "caption" } AI-polish an Instagram caption (Haiku, cost-logged)
 */
import { FieldValue, type Timestamp } from "firebase-admin/firestore";
import { getPublishedPosts } from "@/lib/blog";
import { getAllItems } from "@/lib/catalog";
import { CATEGORY_BY_SLUG } from "@/lib/catalog/categories";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { formatPer10g } from "@/lib/format";
import { allow } from "@/lib/rateLimit";
import { generateCaption } from "@/lib/social/captions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function authed(req: Request): boolean {
  const key = process.env.ADMIN_KEY ?? process.env.MCP_ADMIN_KEY;
  return !!key && req.headers.get("authorization") === `Bearer ${key}`;
}
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
function toIso(ts: unknown): string | null {
  const t = ts as Timestamp | undefined;
  try {
    return t?.toDate ? t.toDate().toISOString() : null;
  } catch {
    return null;
  }
}

export interface SocialItem {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  categoryShort: string;
  priceCents: number | null;
  per10g: string;
  proteinPerServing_g: number;
  savingsPercent: number | null;
  priceIsLive: boolean;
  hasImage: boolean;
}

export async function GET(req: Request) {
  if (!authed(req)) return json({ error: "unauthorized" }, 401);

  const all = await getAllItems(); // sorted cheapest $/g first
  const items: SocialItem[] = all.map((i) => ({
    id: i.id,
    name: i.name,
    brand: i.brand,
    category: i.category,
    categoryShort: CATEGORY_BY_SLUG[i.category]?.short ?? i.category,
    priceCents: i.effectivePriceCents,
    per10g: formatPer10g(i.metrics.costPerGramProteinCents),
    proteinPerServing_g: i.proteinPerServing_g,
    savingsPercent: i.savingsPercent,
    priceIsLive: i.priceIsLive,
    hasImage: !!i.imageUrl,
  }));

  // Suggestions: real sales first (best discount), then the day's rotating
  // best-value pick so there is always something fresh to post.
  const onSale = all
    .filter((i) => (i.savingsPercent ?? 0) > 0 && i.inStock && i.imageUrl)
    .sort((a, b) => (b.savingsPercent ?? 0) - (a.savingsPercent ?? 0))
    .slice(0, 4)
    .map((i) => i.id);
  const byCategory = new Map<string, string>();
  for (const i of all) {
    if (i.metrics.costPerGramProteinCents == null || !i.imageUrl) continue;
    if (!byCategory.has(i.category)) byCategory.set(i.category, i.id);
  }
  const bestValue = [...byCategory.values()];
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const valuePickOfDay = bestValue.length
    ? bestValue[dayIndex % bestValue.length]
    : null;

  const posts = (await getPublishedPosts()).slice(0, 10).map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    tag: p.tag,
    publishedAt: p.publishedAt,
  }));

  // Recent history + auto-prepared queue (small bounded reads)
  let recent: Array<Record<string, unknown>> = [];
  let queue: Array<Record<string, unknown>> = [];
  const db = getAdminDb();
  if (db) {
    try {
      const snap = await db
        .collection(COLLECTIONS.socialPosts)
        .orderBy("ts", "desc")
        .limit(14)
        .get();
      recent = snap.docs.map((d) => {
        const v = d.data();
        return {
          id: d.id,
          kind: v.kind ?? "custom",
          refSlug: v.refSlug ?? null,
          network: v.network ?? "instagram",
          date: v.date ?? null,
          caption: String(v.caption ?? "").slice(0, 140),
          ts: toIso(v.ts),
        };
      });
    } catch {
      /* quota — history is non-essential */
    }
    try {
      // Doc ids are dates, so the newest 3 are just today and the 2 days
      // before — direct lookups need no index (a desc __name__ query does).
      const dates = [0, 1, 2].map((back) =>
        new Date(Date.now() - back * 86_400_000).toISOString().slice(0, 10),
      );
      const snaps = await db.getAll(
        ...dates.map((d) => db.collection(COLLECTIONS.socialQueue).doc(d)),
      );
      queue = snaps
        .filter((s) => s.exists)
        .map((s) => {
          const v = s.data() ?? {};
          return {
            date: s.id,
            kind: v.kind ?? "deal",
            refSlug: v.refSlug ?? null,
            caption: String(v.caption ?? ""),
            status: v.status ?? "ready",
          };
        });
    } catch {
      /* queue is non-essential */
    }
  }

  return json({
    items,
    posts,
    suggestions: {
      onSale,
      valuePickOfDay,
      latestPost: posts[0]?.slug ?? null,
    },
    recent,
    queue,
  });
}

export async function POST(req: Request) {
  if (!authed(req)) return json({ error: "unauthorized" }, 401);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(b.action ?? "");

  if (action === "posted") {
    const db = getAdminDb();
    if (!db) return json({ error: "storage not configured" }, 503);
    try {
      await db.collection(COLLECTIONS.socialPosts).add({
        kind: String(b.kind ?? "custom"),
        refSlug: b.refSlug ? String(b.refSlug) : null,
        network: String(b.network ?? "instagram"),
        size: String(b.size ?? "square"),
        caption: String(b.caption ?? "").slice(0, 3000),
        date: new Date().toISOString().slice(0, 10),
        ts: FieldValue.serverTimestamp(),
      });
      // If this was a prepared queue item, mark it done so the composer's
      // "prepared for you" section reflects reality.
      const queueDate = String(b.queueDate ?? "");
      if (/^\d{4}-\d{2}-\d{2}$/.test(queueDate)) {
        await db
          .collection(COLLECTIONS.socialQueue)
          .doc(queueDate)
          .set({ status: "posted" }, { merge: true });
      }
    } catch (e) {
      return json({ error: `save failed: ${(e as Error).message}` }, 500);
    }
    return json({ ok: true });
  }

  if (action === "caption") {
    if (!process.env.ANTHROPIC_API_KEY) return json({ error: "AI is not configured" }, 503);
    if (!allow("social-caption", 30)) return json({ error: "slow down" }, 429);
    try {
      const caption = await generateCaption(
        String(b.kind ?? "custom"),
        String(b.context ?? "").slice(0, 1500),
      );
      return json({ caption });
    } catch (e) {
      console.error("caption error", e);
      return json({ error: "caption generation failed" }, 502);
    }
  }

  return json({ error: "unknown action" }, 400);
}
