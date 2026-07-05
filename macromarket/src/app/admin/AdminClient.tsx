"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/blog";
import { slugify } from "@/lib/slug";

const KEY_STORE = "mm_admin_key";

interface Draft {
  slug: string;
  title: string;
  tag: string;
  description: string;
  body: string;
  status: "draft" | "published";
  isNew: boolean;
}

const blankDraft = (): Draft => ({
  slug: "",
  title: "",
  tag: "",
  description: "",
  body: "",
  status: "draft",
  isNew: true,
});

export function AdminClient() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          ...(init?.headers ?? {}),
        },
      });
      return res;
    },
    [key],
  );

  const loadPosts = useCallback(async () => {
    const res = await api("/api/admin/posts");
    if (!res.ok) {
      setAuthed(false);
      setNotice("Invalid key.");
      return false;
    }
    const d = await res.json();
    setPosts(d.posts ?? []);
    setAuthed(true);
    return true;
  }, [api]);

  // Try the saved key on mount.
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY_STORE) : null;
    if (saved) setKey(saved);
  }, []);
  useEffect(() => {
    if (key && !authed) void loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function unlock() {
    setNotice(null);
    if (await loadPosts()) localStorage.setItem(KEY_STORE, key);
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setNotice(null);
    const res = await api("/api/admin/posts", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    setBusy(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setNotice(e.error ?? "Save failed.");
      return;
    }
    setNotice("Saved.");
    setDraft(null);
    void loadPosts();
  }

  async function del(slug: string) {
    if (!confirm(`Delete "${slug}"?`)) return;
    await api(`/api/admin/posts?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    void loadPosts();
  }

  async function generate() {
    if (!topic.trim()) return;
    setBusy(true);
    setNotice("Generating draft…");
    const res = await api("/api/admin/generate", {
      method: "POST",
      body: JSON.stringify({ topic }),
    });
    setBusy(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      setNotice(e.error ?? "Generation failed.");
      return;
    }
    const d = await res.json();
    setNotice("Draft generated — review and save.");
    setDraft({
      slug: d.slug ?? slugify(d.title ?? topic),
      title: d.title ?? topic,
      tag: "",
      description: d.description ?? "",
      body: d.body ?? "",
      status: "draft",
      isNew: true,
    });
  }

  const input =
    "w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <h1 className="font-heading text-2xl font-bold text-ink">MacroMarket admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the admin key to manage blog content.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
          placeholder="Admin key"
          className={`${input} mt-4`}
        />
        <button
          onClick={unlock}
          className="btn-clay mt-3 px-4 py-2 text-sm text-white"
        >
          Unlock
        </button>
        {notice && <p className="mt-3 text-sm text-[color:var(--color-berry)]">{notice}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">Content admin</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/blog" className="font-semibold text-primary">
            View blog
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem(KEY_STORE);
              setAuthed(false);
              setKey("");
            }}
            className="text-muted-foreground hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>

      {notice && (
        <p className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-[color:var(--color-leaf-deep)]">
          {notice}
        </p>
      )}

      {/* AI draft generator */}
      <section className="mt-5 rounded-xl border border-line bg-white p-4">
        <h2 className="font-heading text-lg font-bold text-ink">Generate a draft</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Describe a post; the AI writes it grounded in the live catalog data (real
          prices only). Review and edit before publishing.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Cheapest vegan protein sources in 2026"
            className={input}
            disabled={busy}
          />
          <button
            onClick={generate}
            disabled={busy || !topic.trim()}
            className="btn-clay shrink-0 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Working…" : "Generate"}
          </button>
        </div>
      </section>

      {/* Editor */}
      {draft && (
        <section className="mt-5 rounded-xl border border-primary/40 bg-white p-4 ring-1 ring-primary/20">
          <h2 className="font-heading text-lg font-bold text-ink">
            {draft.isNew ? "New post" : `Editing: ${draft.slug}`}
          </h2>
          <div className="mt-3 grid gap-3">
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Title
              <input
                value={draft.title}
                onChange={(e) =>
                  setDraft((d) =>
                    d
                      ? {
                          ...d,
                          title: e.target.value,
                          slug: d.isNew ? slugify(e.target.value) : d.slug,
                        }
                      : d,
                  )
                }
                className={`${input} mt-1 font-normal normal-case`}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Slug
                <input
                  value={draft.slug}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, slug: slugify(e.target.value) } : d))
                  }
                  className={`${input} mt-1 font-normal normal-case`}
                />
              </label>
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Tag
                <input
                  value={draft.tag}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, tag: e.target.value } : d))
                  }
                  placeholder="Guide"
                  className={`${input} mt-1 font-normal normal-case`}
                />
              </label>
            </div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Description
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, description: e.target.value } : d))
                }
                rows={2}
                className={`${input} mt-1 font-normal normal-case`}
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Body (markdown)
              <textarea
                value={draft.body}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, body: e.target.value } : d))
                }
                rows={16}
                className={`${input} mt-1 font-mono text-xs font-normal normal-case`}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                Status
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, status: e.target.value as Draft["status"] } : d,
                    )
                  }
                  className="rounded-md border border-line bg-white px-2 py-1.5 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <button
                onClick={save}
                disabled={busy || !draft.title.trim()}
                className="btn-clay px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setDraft(null)}
                className="text-sm font-semibold text-muted-foreground hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Post list */}
      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-ink">
            Posts ({posts.length})
          </h2>
          <button
            onClick={() => setDraft(blankDraft())}
            className="btn-soft px-3 py-1.5 text-sm"
          >
            + New post
          </button>
        </div>
        {posts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted-foreground">
            No posts yet. Generate a draft above or start a new post.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-line bg-white">
            {posts.map((p) => (
              <div key={p.slug} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-ink">{p.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    /{p.slug}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <span
                    className={
                      p.status === "published"
                        ? "rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-[color:var(--color-leaf-deep)]"
                        : "rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground"
                    }
                  >
                    {p.status}
                  </span>
                  <button
                    onClick={() =>
                      setDraft({
                        slug: p.slug,
                        title: p.title,
                        tag: p.tag ?? "",
                        description: p.description,
                        body: p.body,
                        status: p.status,
                        isNew: false,
                      })
                    }
                    className="font-semibold text-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => del(p.slug)}
                    className="text-muted-foreground hover:text-[color:var(--color-berry)]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
