/**
 * Daily content automation — called by the Netlify scheduled functions each
 * morning (one task per call to stay inside serverless time limits):
 *
 *   POST /api/admin/daily?task=blog    → AI blog draft saved to the Content tab
 *   POST /api/admin/daily?task=social  → today's Instagram post prepared in the
 *                                        Social tab (content picked + caption)
 *
 * Both tasks are idempotent per calendar day; pass ?force=1 to regenerate.
 */
import { FieldValue } from "firebase-admin/firestore";
import { getPublishedPosts } from "@/lib/blog";
import { generateBlogDraft } from "@/lib/blogGenerate";
import { getAllItems } from "@/lib/catalog";
import { CATEGORIES, CATEGORY_BY_SLUG } from "@/lib/catalog/categories";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { formatPer10g, formatPrice } from "@/lib/format";
import { submitToIndexNow } from "@/lib/indexnow";
import { generateCaption } from "@/lib/social/captions";
import { buildWeeklyDigest, sendDigest } from "@/lib/social/digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
const today = () => new Date().toISOString().slice(0, 10);
const dayIndex = () => Math.floor(Date.now() / 86_400_000);

/** Deterministic daily topic rotation with real catalog anchors. */
function pickTopic(): string {
  const now = new Date();
  const stamp = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const topics: string[] = [
    ...CATEGORIES.map(
      (c) =>
        `The cheapest ${c.name.toLowerCase()} right now, ranked by price per 10g of protein (${stamp})`,
    ),
    `Whole foods vs protein supplements: which actually costs less per 10g of protein in ${stamp}?`,
    "Best vegan protein for the money: powders, tofu, and beans compared",
    "High-protein meal prep on a budget: the cheapest staples to build around",
    "How much protein do you actually need — and the cheapest way to hit it",
    "Best keto-friendly protein per dollar: what to buy and what to skip",
    "The best protein snacks for the office: no fridge, no blender, no regret",
    "Protein bars vs ready-to-drink shakes: which convenience costs less per gram?",
    "5 underrated cheap protein sources most shoppers walk right past",
    "Reading a protein label like a pro: servings, scoops, and the math that matters",
    "The true cost of 'premium' protein: when paying more per gram makes sense",
    "Canned fish is a protein cheat code: the best value picks ranked",
    "Cottage cheese and Greek yogurt: the fridge aisle's best protein deals",
    "Post-workout protein for the cost of a coffee: cheap options that work",
  ];
  return topics[dayIndex() % topics.length];
}

async function runBlogTask(force: boolean) {
  const db = getAdminDb();
  if (!db) return { task: "blog", ok: false, error: "storage not configured" };

  const date = today();
  if (!force) {
    const existing = await db
      .collection(COLLECTIONS.posts)
      .where("dailyDate", "==", date)
      .limit(1)
      .get();
    if (!existing.empty) {
      return { task: "blog", ok: true, skipped: "already generated today", slug: existing.docs[0].id };
    }
  }

  const topic = pickTopic();
  const draft = await generateBlogDraft(topic);

  // never overwrite an existing post with a colliding slug
  let slug = draft.slug || `daily-${date}`;
  const clash = await db.collection(COLLECTIONS.posts).doc(slug).get();
  if (clash.exists) slug = `${slug}-${date}`;

  await db.collection(COLLECTIONS.posts).doc(slug).set({
    title: draft.title,
    description: draft.description,
    body: draft.body,
    tag: "Daily",
    status: "draft",
    dailyDate: date,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  // Prices refresh daily, so nudge search engines to recrawl the value pages.
  void submitToIndexNow([
    "/",
    "/deals",
    "/price-index",
    "/best/cheapest-protein-overall",
  ]);
  return { task: "blog", ok: true, slug, topic };
}

async function runSocialTask(force: boolean) {
  const db = getAdminDb();
  if (!db) return { task: "social", ok: false, error: "storage not configured" };

  const date = today();
  const ref = db.collection(COLLECTIONS.socialQueue).doc(date);
  if (!force && (await ref.get()).exists) {
    return { task: "social", ok: true, skipped: "already prepared today" };
  }

  // Don't repeat anything featured in the last week of prepared posts. Doc ids
  // are dates, so direct lookups avoid the index a desc __name__ query needs.
  const recentlyUsed = new Set<string>();
  try {
    const dates = [1, 2, 3, 4, 5, 6, 7].map((back) =>
      new Date(Date.now() - back * 86_400_000).toISOString().slice(0, 10),
    );
    const snaps = await db.getAll(
      ...dates.map((d) => db.collection(COLLECTIONS.socialQueue).doc(d)),
    );
    for (const s of snaps) {
      const slug = s.exists ? s.data()?.refSlug : null;
      if (slug) recentlyUsed.add(String(slug));
    }
  } catch {
    /* fine — worst case we repeat */
  }

  // Fresh blog post (≤3 days old, not already featured) takes priority; then the
  // best live discount; then the rotating value pick.
  const posts = await getPublishedPosts();
  const freshPost = posts.find((p) => {
    const at = p.publishedAt ?? p.createdAt;
    return (
      at &&
      Date.now() - new Date(at).getTime() < 3 * 86_400_000 &&
      !recentlyUsed.has(p.slug)
    );
  });

  let kind: "deal" | "blog";
  let refSlug: string;
  let context: string;

  if (freshPost) {
    kind = "blog";
    refSlug = freshPost.slug;
    context = `Blog post: "${freshPost.title}" — ${freshPost.description}`;
  } else {
    const all = await getAllItems();
    const candidates = all.filter(
      (i) =>
        i.imageUrl &&
        i.inStock &&
        i.metrics.costPerGramProteinCents != null &&
        !recentlyUsed.has(i.id),
    );
    const onSale = candidates
      .filter((i) => (i.savingsPercent ?? 0) > 0)
      .sort((a, b) => (b.savingsPercent ?? 0) - (a.savingsPercent ?? 0));
    const byCategory = new Map<string, (typeof candidates)[number]>();
    for (const i of candidates) {
      if (!byCategory.has(i.category)) byCategory.set(i.category, i);
    }
    const valuePicks = [...byCategory.values()];
    const pick =
      onSale[0] ?? valuePicks[dayIndex() % Math.max(1, valuePicks.length)];
    if (!pick) return { task: "social", ok: false, error: "no candidate item" };

    kind = "deal";
    refSlug = pick.id;
    const cat = CATEGORY_BY_SLUG[pick.category]?.short ?? pick.category;
    context = `Product: ${pick.brand ?? ""} ${pick.name}. Price ${formatPrice(pick.effectivePriceCents)} (${pick.priceIsLive ? "live Amazon price" : "typical price"}). Value: ${formatPer10g(pick.metrics.costPerGramProteinCents)} per 10 g of protein. ${pick.proteinPerServing_g} g protein per serving. ${(pick.savingsPercent ?? 0) > 0 ? `${pick.savingsPercent}% off right now.` : ""} Category: ${cat}.`;
  }

  const caption = await generateCaption(kind, context);
  await ref.set({
    kind,
    refSlug,
    caption,
    status: "ready",
    createdAt: FieldValue.serverTimestamp(),
  });
  return { task: "social", ok: true, kind, refSlug };
}

async function runDigestTask(force: boolean) {
  const db = getAdminDb();
  if (!db) return { task: "digest", ok: false, error: "storage not configured" };

  const date = today();
  const ref = db.collection(COLLECTIONS.digests).doc(date);
  if (!force && (await ref.get()).exists) {
    return { task: "digest", ok: true, skipped: "already built today" };
  }

  const digest = await buildWeeklyDigest();

  // Active subscribers (bounded read).
  const subsSnap = await db
    .collection(COLLECTIONS.subscribers)
    .where("status", "==", "active")
    .limit(5000)
    .get();
  const recipients = subsSnap.docs
    .map((d) => String(d.data().email ?? ""))
    .filter((e) => e.includes("@"));

  const { sent, error } = await sendDigest(recipients, digest);

  await ref.set({
    subject: digest.subject,
    html: digest.html,
    text: digest.text,
    recipientCount: recipients.length,
    sent,
    sendError: error ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    task: "digest",
    ok: true,
    subscribers: recipients.length,
    sent,
    // If Resend isn't configured the digest is stored for manual send.
    stored: sent === 0,
    note: error,
  };
}

export async function POST(req: Request) {
  if (!authed(req)) return json({ error: "unauthorized" }, 401);
  const url = new URL(req.url);
  const task = url.searchParams.get("task") ?? "";
  const force = url.searchParams.get("force") === "1";

  try {
    if (task === "blog") return json(await runBlogTask(force));
    if (task === "social") return json(await runSocialTask(force));
    if (task === "digest") return json(await runDigestTask(force));
    return json({ error: "task must be 'blog', 'social', or 'digest'" }, 400);
  } catch (e) {
    console.error(`daily ${task} error`, e);
    return json({ task, ok: false, error: (e as Error).message }, 502);
  }
}
