/**
 * Blog storage (Firestore `posts`, doc id = slug). Reads are used by the public
 * /blog pages; writes happen in the admin API. Degrades to empty when Firebase
 * isn't configured.
 */
import type { DocumentData, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export interface Post {
  slug: string;
  title: string;
  description: string;
  body: string; // markdown
  status: "draft" | "published";
  tag: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
}

function toIso(ts: unknown): string | null {
  const t = ts as Timestamp | undefined;
  try {
    return t?.toDate ? t.toDate().toISOString() : null;
  } catch {
    return null;
  }
}

function toPost(id: string, d: DocumentData): Post {
  return {
    slug: id,
    title: String(d.title ?? "Untitled"),
    description: String(d.description ?? ""),
    body: String(d.body ?? ""),
    status: d.status === "published" ? "published" : "draft",
    tag: d.tag ?? null,
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
    publishedAt: toIso(d.publishedAt),
  };
}

/** All posts (drafts included) — admin only. */
export async function getAllPosts(): Promise<Post[]> {
  const db = getAdminDb();
  if (!db) return [];
  try {
    const snap = await db.collection(COLLECTIONS.posts).limit(300).get();
    return snap.docs
      .map((doc) => toPost(doc.id, doc.data()))
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  } catch {
    return [];
  }
}

/** Published posts, newest first. */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts
    .filter((p) => p.status === "published")
    .sort((a, b) =>
      (b.publishedAt ?? b.createdAt ?? "").localeCompare(
        a.publishedAt ?? a.createdAt ?? "",
      ),
    );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const db = getAdminDb();
  if (!db) return null;
  try {
    const snap = await db.collection(COLLECTIONS.posts).doc(slug).get();
    if (!snap.exists) return null;
    return toPost(snap.id, snap.data() as DocumentData);
  } catch {
    return null;
  }
}
