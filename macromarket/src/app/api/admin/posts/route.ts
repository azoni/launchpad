import { FieldValue } from "firebase-admin/firestore";
import { getAllPosts } from "@/lib/blog";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { submitToIndexNow } from "@/lib/indexnow";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(req: Request) {
  if (!authed(req)) return json({ error: "unauthorized" }, 401);
  return json({ posts: await getAllPosts() });
}

export async function POST(req: Request) {
  if (!authed(req)) return json({ error: "unauthorized" }, 401);
  const db = getAdminDb();
  if (!db) return json({ error: "storage not configured" }, 503);

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const title = String(b.title ?? "").trim();
  const slug = slugify(String(b.slug ?? "") || title);
  if (!title || !slug) return json({ error: "title is required" }, 400);

  const ref = db.collection(COLLECTIONS.posts).doc(slug);
  const status = b.status === "published" ? "published" : "draft";

  // Best-effort existence check — if reads are quota-limited, assume new so the
  // write still lands (writes have a separate quota from reads).
  let exists = false;
  let wasPublished = false;
  try {
    const existing = await ref.get();
    exists = existing.exists;
    wasPublished = exists && existing.data()?.status === "published";
  } catch {
    /* treat as new */
  }

  const data: Record<string, unknown> = {
    title,
    description: String(b.description ?? ""),
    body: String(b.body ?? ""),
    tag: b.tag ? String(b.tag) : null,
    status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!exists) data.createdAt = FieldValue.serverTimestamp();
  if (status === "published" && !wasPublished) {
    data.publishedAt = FieldValue.serverTimestamp();
  }

  try {
    await ref.set(data, { merge: true });
  } catch (e) {
    return json({ error: `save failed: ${(e as Error).message}` }, 500);
  }
  // Ping IndexNow the moment a post goes (or stays) public so it's recrawled fast.
  if (status === "published") {
    void submitToIndexNow([`/blog/${slug}`, "/blog", "/"]);
  }
  return json({ ok: true, slug });
}

export async function DELETE(req: Request) {
  if (!authed(req)) return json({ error: "unauthorized" }, 401);
  const db = getAdminDb();
  if (!db) return json({ error: "storage not configured" }, 503);
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return json({ error: "slug required" }, 400);
  await db.collection(COLLECTIONS.posts).doc(slug).delete();
  return json({ ok: true });
}
