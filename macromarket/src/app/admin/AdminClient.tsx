"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SocialComposer } from "@/components/admin/SocialComposer";
import type { Post } from "@/lib/blog";
import { formatPer10g } from "@/lib/format";
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

interface Overview {
  stats: {
    readOk: boolean;
    chats: {
      totalCalls: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      totalCostUSD: number;
      last7d: { calls: number; costUSD: number };
      byModel: { model: string; calls: number; tokens: number; costUSD: number }[];
      recent: { prompt: string; model: string; tokens: number; costUSD: number; ts: string | null }[];
    };
    affiliate: {
      totalClicks: number;
      last7d: number;
      byProduct: { slug: string; clicks: number }[];
    };
  };
  flagged: {
    slug: string;
    name: string;
    per10gCents: number | null;
    priceCents: number;
    reasons: string[];
  }[];
  health: {
    livePricing: boolean;
    firestorePriceCache: boolean;
    firebase: boolean;
    anthropic: boolean;
    amazon: boolean;
    catalogCount: number;
    flaggedCount: number;
  };
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

const usd = (n: number) => (n === 0 ? "$0" : n < 1 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`);
const num = (n: number) => n.toLocaleString("en-US");
function ago(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function AdminClient() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [view, setView] = useState<"overview" | "content" | "social">("overview");
  const [posts, setPosts] = useState<Post[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const api = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          ...(init?.headers ?? {}),
        },
      }),
    [key],
  );

  const loadPosts = useCallback(async () => {
    const res = await api("/api/admin/posts");
    if (!res.ok) {
      setAuthed(false);
      setNotice("Invalid key.");
      return false;
    }
    setPosts((await res.json()).posts ?? []);
    setAuthed(true);
    return true;
  }, [api]);

  const loadOverview = useCallback(async () => {
    const res = await api("/api/admin/overview");
    if (res.ok) setOverview(await res.json());
  }, [api]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(KEY_STORE) : null;
    if (saved) setKey(saved);
  }, []);
  useEffect(() => {
    if (key && !authed) {
      void loadPosts().then((ok) => {
        if (ok) void loadOverview();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function unlock() {
    setNotice(null);
    if (await loadPosts()) {
      localStorage.setItem(KEY_STORE, key);
      void loadOverview();
    }
  }

  async function save() {
    if (!draft) return;
    setBusy(true);
    setNotice(null);
    const res = await api("/api/admin/posts", { method: "POST", body: JSON.stringify(draft) });
    setBusy(false);
    if (!res.ok) {
      setNotice((await res.json().catch(() => ({}))).error ?? "Save failed.");
      return;
    }
    setNotice("Saved.");
    setDraft(null);
    void loadPosts();
  }

  async function del(slug: string) {
    if (!confirm(`Delete "${slug}"?`)) return;
    await api(`/api/admin/posts?slug=${encodeURIComponent(slug)}`, { method: "DELETE" });
    void loadPosts();
  }

  async function generate() {
    if (!topic.trim()) return;
    setBusy(true);
    setNotice("Generating draft…");
    const res = await api("/api/admin/generate", { method: "POST", body: JSON.stringify({ topic }) });
    setBusy(false);
    if (!res.ok) {
      setNotice((await res.json().catch(() => ({}))).error ?? "Generation failed.");
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
    setView("content");
  }

  const input =
    "w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
        <h1 className="font-heading text-2xl font-bold text-ink">MacroMarket admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the admin key.</p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && unlock()}
          placeholder="Admin key"
          className={`${input} mt-4`}
        />
        <button onClick={unlock} className="btn-clay mt-3 px-4 py-2 text-sm text-white">
          Unlock
        </button>
        {notice && <p className="mt-3 text-sm text-[color:var(--color-berry)]">{notice}</p>}
      </div>
    );
  }

  const h = overview?.health;
  const st = overview?.stats;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-1">
          {(["overview", "content", "social"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-bold capitalize ${
                view === v ? "bg-primary text-primary-foreground" : "text-ink hover:bg-secondary"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button onClick={loadOverview} className="font-semibold text-primary">
            Refresh
          </button>
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

      {view === "overview" ? (
        <div className="mt-5 flex flex-col gap-6">
          {/* Health */}
          <section className="flex flex-wrap gap-2">
            {h &&
              (
                [
                  ["Live pricing", h.livePricing],
                  ["Firestore price cache", h.firestorePriceCache],
                  ["Firebase", h.firebase],
                  ["Anthropic", h.anthropic],
                  ["Amazon", h.amazon],
                ] as [string, boolean][]
              ).map(([label, on]) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                    on
                      ? "border-line bg-secondary text-[color:var(--color-leaf-deep)]"
                      : "border-line bg-muted text-muted-foreground"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${on ? "bg-[color:var(--color-leaf)]" : "bg-muted-foreground"}`} />
                  {label}: {on ? "on" : "off"}
                </span>
              ))}
          </section>

          {/* Read-quota notice — 0s are "unknown", not "no usage" */}
          {st && !st.readOk && (
            <p className="rounded-lg border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold-soft)] px-4 py-3 text-sm text-[color:var(--color-ink)]">
              <strong>Usage data can&apos;t be read right now.</strong> The Firestore
              daily read quota is used up, so the numbers below show 0 even though
              chats and clicks are still being recorded. They&apos;ll reappear after
              the nightly reset — or immediately on the Firebase Blaze plan.
            </p>
          )}

          {/* Summary cards */}
          {st && (
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["AI chats", num(st.chats.totalCalls), `${num(st.chats.last7d.calls)} in 7d`],
                ["Tokens", num(st.chats.totalTokens), `${num(st.chats.inputTokens)} in / ${num(st.chats.outputTokens)} out`],
                ["AI cost", usd(st.chats.totalCostUSD), `${usd(st.chats.last7d.costUSD)} in 7d`],
                ["Affiliate clicks", num(st.affiliate.totalClicks), `${num(st.affiliate.last7d)} in 7d`],
              ].map(([label, value, sub]) => (
                <div key={label} className="price-tag-card p-4">
                  <div className="text-xs font-semibold text-muted-foreground">{label}</div>
                  <div className="tabular mt-1 text-2xl font-bold text-ink">{value}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
                </div>
              ))}
            </section>
          )}

          {!overview && (
            <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted-foreground">
              Loading… (if usage shows 0, the Firestore read quota may be resetting —
              writes still work.)
            </p>
          )}

          {/* Usage by model */}
          {st && st.chats.byModel.length > 0 && (
            <section>
              <h2 className="mb-2 font-heading text-lg font-bold text-ink">Usage by model</h2>
              <div className="overflow-x-auto rounded-xl border border-line bg-white">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead className="border-b border-line text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Model</th>
                      <th className="px-3 py-2 text-right font-semibold">Calls</th>
                      <th className="px-3 py-2 text-right font-semibold">Tokens</th>
                      <th className="px-3 py-2 text-right font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {st.chats.byModel.map((m) => (
                      <tr key={m.model}>
                        <td className="px-3 py-2 font-semibold text-ink">{m.model}</td>
                        <td className="tabular px-3 py-2 text-right">{num(m.calls)}</td>
                        <td className="tabular px-3 py-2 text-right">{num(m.tokens)}</td>
                        <td className="tabular px-3 py-2 text-right">{usd(m.costUSD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Flagged for review */}
          {overview && (
            <section>
              <h2 className="mb-2 font-heading text-lg font-bold text-ink">
                Flagged for review ({h?.flaggedCount ?? 0})
              </h2>
              {overview.flagged.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted-foreground">
                  Nothing flagged.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-line bg-white">
                  <table className="w-full min-w-[32rem] text-sm">
                    <thead className="border-b border-line text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Item</th>
                        <th className="px-3 py-2 text-right font-semibold">/10g</th>
                        <th className="px-3 py-2 font-semibold">Why</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {overview.flagged.slice(0, 40).map((f) => (
                        <tr key={f.slug}>
                          <td className="px-3 py-2">
                            <Link href={`/food/${f.slug}`} className="font-semibold text-ink hover:text-primary">
                              {f.name}
                            </Link>
                          </td>
                          <td className="tabular px-3 py-2 text-right">{formatPer10g(f.per10gCents)}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{f.reasons.join(", ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Top products + recent chats */}
          {st && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section>
                <h2 className="mb-2 font-heading text-lg font-bold text-ink">Top clicked products</h2>
                {st.affiliate.byProduct.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted-foreground">None yet.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {st.affiliate.byProduct.slice(0, 12).map((p) => (
                      <li key={p.slug} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2">
                        <Link href={`/food/${p.slug}`} className="truncate text-sm font-semibold text-ink hover:text-primary">
                          {p.slug}
                        </Link>
                        <span className="tabular shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-[color:var(--color-leaf-deep)]">
                          {num(p.clicks)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section>
                <h2 className="mb-2 font-heading text-lg font-bold text-ink">Recent coach chats</h2>
                {st.chats.recent.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line p-4 text-sm text-muted-foreground">None yet.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {st.chats.recent.slice(0, 12).map((c, i) => (
                      <li key={i} className="rounded-lg border border-line bg-white px-3 py-2">
                        <p className="line-clamp-1 text-sm text-ink">{c.prompt || "—"}</p>
                        <p className="tabular mt-0.5 text-xs text-muted-foreground">
                          {ago(c.ts)} · {num(c.tokens)} tok · {usd(c.costUSD)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      ) : view === "social" ? (
        <SocialComposer api={api} adminKey={key} />
      ) : (
        <div className="mt-5 flex flex-col gap-5">
          {/* AI draft generator */}
          <section className="rounded-xl border border-line bg-white p-4">
            <h2 className="font-heading text-lg font-bold text-ink">Generate a draft</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Describe a post; the AI writes it grounded in live catalog data (real prices only).
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
            <section className="rounded-xl border border-primary/40 bg-white p-4 ring-1 ring-primary/20">
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
                        d ? { ...d, title: e.target.value, slug: d.isNew ? slugify(e.target.value) : d.slug } : d,
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
                      onChange={(e) => setDraft((d) => (d ? { ...d, slug: slugify(e.target.value) } : d))}
                      className={`${input} mt-1 font-normal normal-case`}
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Tag
                    <input
                      value={draft.tag}
                      onChange={(e) => setDraft((d) => (d ? { ...d, tag: e.target.value } : d))}
                      placeholder="Guide"
                      className={`${input} mt-1 font-normal normal-case`}
                    />
                  </label>
                </div>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Description
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                    rows={2}
                    className={`${input} mt-1 font-normal normal-case`}
                  />
                </label>
                <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Body (markdown)
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))}
                    rows={16}
                    className={`${input} mt-1 font-mono text-xs font-normal normal-case`}
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                    Status
                    <select
                      value={draft.status}
                      onChange={(e) => setDraft((d) => (d ? { ...d, status: e.target.value as Draft["status"] } : d))}
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
                  <button onClick={() => setDraft(null)} className="text-sm font-semibold text-muted-foreground hover:text-ink">
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Post list */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-ink">Posts ({posts.length})</h2>
              <button onClick={() => setDraft(blankDraft())} className="btn-soft px-3 py-1.5 text-sm">
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
                      <div className="truncate text-xs text-muted-foreground">/{p.slug}</div>
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
                      <button onClick={() => del(p.slug)} className="text-muted-foreground hover:text-[color:var(--color-berry)]">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
