"use client";

/**
 * Daily-poster composer (admin → Social tab). Pick a deal, blog post, or custom
 * message; the branded card + caption are generated instantly. Manual flow by
 * design: download PNG → copy caption → post on Instagram → "Mark as posted"
 * records it in Firestore so the history shows what went out and when.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, RefreshCw, Sparkles } from "lucide-react";

interface SocialItem {
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
interface SocialPost {
  slug: string;
  title: string;
  description: string;
  tag: string | null;
  publishedAt: string | null;
}
interface SocialData {
  items: SocialItem[];
  posts: SocialPost[];
  suggestions: {
    onSale: string[];
    valuePickOfDay: string | null;
    latestPost: string | null;
  };
  recent: {
    id: string;
    kind: string;
    refSlug: string | null;
    network: string;
    date: string | null;
    caption: string;
    ts: string | null;
  }[];
  queue: {
    date: string;
    kind: string;
    refSlug: string | null;
    caption: string;
    status: string;
  }[];
}

type Kind = "deal" | "blog" | "custom";
type Size = "square" | "portrait" | "story" | "pin";

const SIZES: { value: Size; label: string; dims: string }[] = [
  { value: "square", label: "Square", dims: "1080×1080" },
  { value: "portrait", label: "Portrait", dims: "1080×1350" },
  { value: "story", label: "Story", dims: "1080×1920" },
  { value: "pin", label: "Pinterest", dims: "1000×1500" },
];

const CATEGORY_HASHTAGS: Record<string, string> = {
  "whey-protein": "#wheyprotein",
  "plant-protein": "#plantprotein",
  "protein-bars": "#proteinbars",
  "rtd-shakes": "#proteinshake",
  "jerky-meat-snacks": "#jerky",
  "canned-seafood": "#cannedtuna",
  "greek-yogurt-cottage-cheese": "#greekyogurt",
  "protein-cereal-snacks": "#proteinsnacks",
  "nut-seed-butters": "#peanutbutter",
  "poultry-lean-meat": "#leanprotein",
  "eggs-dairy": "#eggs",
  "legumes-beans": "#plantbasedprotein",
  "tofu-tempeh-soy": "#tofu",
  "seafood-whole": "#seafood",
};

const usd = (cents: number | null) => (cents == null ? "—" : `$${(cents / 100).toFixed(2)}`);

function dealCaption(it: SocialItem): string {
  const price = usd(it.priceCents);
  const savings =
    (it.savingsPercent ?? 0) > 0 ? ` It's ${it.savingsPercent}% off right now.` : "";
  const catTag = CATEGORY_HASHTAGS[it.category] ?? "#protein";
  return `${it.brand ? `${it.brand} ` : ""}${it.name} is one of the best protein buys on the board today — ${price} works out to ${it.per10g} per 10 g of protein (${it.proteinPerServing_g} g per serving).${savings}

We rank every powder, bar, shake, and whole food by cost per 10 g of protein, so your money buys the most muscle fuel.

🛒 Link in bio
#protein #highprotein #proteindeals #macros #mealprep #fitnessfood #budgetfitness #nutrition ${catTag}`;
}

function blogCaption(p: SocialPost): string {
  return `New on the blog: ${p.title}

${p.description}

Full read at macromarket-app.netlify.app — every recommendation is backed by our cost-per-10g-of-protein rankings, never vibes.

🛒 Link in bio
#protein #highprotein #nutrition #mealprep #macros #fitnessfood #proteindeals #budgetfitness`;
}

export function SocialComposer({
  api,
  adminKey,
}: {
  api: (path: string, init?: RequestInit) => Promise<Response>;
  adminKey: string;
}) {
  const [data, setData] = useState<SocialData | null>(null);
  const [kind, setKind] = useState<Kind>("deal");
  const [dealSlug, setDealSlug] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [sub, setSub] = useState("");
  const [badge, setBadge] = useState("");
  const [size, setSize] = useState<Size>("square");
  const [caption, setCaption] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadedQueueDate, setLoadedQueueDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await api("/api/admin/social");
    if (res.ok) {
      const d = (await res.json()) as SocialData;
      setData(d);
      // sensible first selection: today's suggestion
      setDealSlug((cur) => cur || d.suggestions.onSale[0] || d.suggestions.valuePickOfDay || "");
      setPostSlug((cur) => cur || d.suggestions.latestPost || "");
    }
  }, [api]);
  useEffect(() => {
    void load();
  }, [load]);

  const itemById = useMemo(
    () => new Map((data?.items ?? []).map((i) => [i.id, i])),
    [data],
  );
  const postBySlug = useMemo(
    () => new Map((data?.posts ?? []).map((p) => [p.slug, p])),
    [data],
  );

  const selItem = itemById.get(dealSlug) ?? null;
  const selPost = postBySlug.get(postSlug) ?? null;

  // Refresh the caption template whenever the selection changes — unless the
  // selection change came from loading a prepared post (its caption wins).
  const keepCaptionOnce = useRef(false);
  useEffect(() => {
    if (keepCaptionOnce.current) {
      keepCaptionOnce.current = false;
      return;
    }
    if (kind === "deal" && selItem) setCaption(dealCaption(selItem));
    else if (kind === "blog" && selPost) setCaption(blogCaption(selPost));
    else if (kind === "custom")
      setCaption(
        headline
          ? `${headline}\n\n${sub}\n\n🛒 Link in bio\n#protein #highprotein #nutrition #macros #mealprep #fitnessfood`
          : "",
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, dealSlug, postSlug, headline, sub]);

  const cardUrl = useMemo(() => {
    const p = new URLSearchParams({ kind, size, key: adminKey });
    if (kind === "deal") {
      if (!dealSlug) return null;
      p.set("slug", dealSlug);
    } else if (kind === "blog") {
      if (!postSlug) return null;
      p.set("slug", postSlug);
    } else {
      if (!headline.trim()) return null;
      p.set("headline", headline);
      if (sub) p.set("sub", sub);
      if (badge) p.set("badge", badge);
    }
    return `/api/social-card?${p.toString()}`;
  }, [kind, size, dealSlug, postSlug, headline, sub, badge, adminKey]);

  const today = new Date().toISOString().slice(0, 10);
  const postedToday = (data?.recent ?? []).some((r) => r.date === today);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = data?.items ?? [];
    if (!q) return list.slice(0, 60);
    return list
      .filter((i) => `${i.name} ${i.brand ?? ""} ${i.categoryShort}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [data, search]);

  async function aiCaption() {
    setBusy(true);
    setNote("Writing caption…");
    const context =
      kind === "deal" && selItem
        ? `Product: ${selItem.brand ?? ""} ${selItem.name}. Price ${usd(selItem.priceCents)} (${selItem.priceIsLive ? "live Amazon price" : "typical price"}). Value: ${selItem.per10g} per 10 g of protein. ${selItem.proteinPerServing_g} g protein per serving. ${(selItem.savingsPercent ?? 0) > 0 ? `${selItem.savingsPercent}% off right now.` : ""} Category: ${selItem.categoryShort}.`
        : kind === "blog" && selPost
          ? `Blog post: "${selPost.title}" — ${selPost.description}`
          : `Custom message: ${headline}. ${sub}`;
    const res = await api("/api/admin/social", {
      method: "POST",
      body: JSON.stringify({ action: "caption", kind, context }),
    });
    setBusy(false);
    if (!res.ok) {
      setNote((await res.json().catch(() => ({}))).error ?? "Caption failed.");
      return;
    }
    setCaption((await res.json()).caption ?? caption);
    setNote(null);
  }

  async function download() {
    if (!cardUrl) return;
    setBusy(true);
    setNote("Rendering PNG…");
    try {
      const res = await fetch(cardUrl);
      if (!res.ok) throw new Error(`render failed (${res.status})`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const ref = kind === "deal" ? dealSlug : kind === "blog" ? postSlug : "custom";
      a.download = `macromarket-${kind}-${ref}-${size}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setNote(null);
    } catch (e) {
      setNote((e as Error).message);
    }
    setBusy(false);
  }

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setNote("Copy failed — select the text manually.");
    }
  }

  function loadQueued(q: SocialData["queue"][number]) {
    keepCaptionOnce.current = true;
    if (q.kind === "blog" && q.refSlug) {
      setKind("blog");
      setPostSlug(q.refSlug);
    } else if (q.refSlug) {
      setKind("deal");
      setDealSlug(q.refSlug);
    }
    setLoadedQueueDate(q.date);
    setCaption(q.caption);
  }

  async function markPosted() {
    setBusy(true);
    const res = await api("/api/admin/social", {
      method: "POST",
      body: JSON.stringify({
        action: "posted",
        kind,
        refSlug: kind === "deal" ? dealSlug : kind === "blog" ? postSlug : null,
        network: "instagram",
        size,
        caption,
        queueDate: loadedQueueDate,
      }),
    });
    setBusy(false);
    setNote(res.ok ? "Recorded — nice, that's today's post done. ✅" : "Could not record the post.");
    void load();
  }

  const input =
    "w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
      active ? "bg-primary text-primary-foreground" : "border border-line bg-white text-ink hover:bg-secondary"
    }`;

  if (!data) {
    return (
      <p className="mt-5 rounded-lg border border-dashed border-line p-6 text-sm text-muted-foreground">
        Loading composer…
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      {/* Daily status + suggestions */}
      <section className="rounded-xl border border-line bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold text-ink">Daily post</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              postedToday
                ? "bg-secondary text-[color:var(--color-leaf-deep)]"
                : "bg-[color:var(--color-gold-soft)] text-[color:var(--color-gold)]"
            }`}
          >
            {postedToday ? "✓ Posted today" : "Not posted yet today"}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a suggestion (or anything below), download the card, copy the
          caption, post it, then mark it done.
        </p>

        {/* Auto-prepared daily posts (scheduled job) */}
        {data.queue.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5">
            {data.queue.map((qd) => (
              <div
                key={qd.date}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                  qd.status === "posted"
                    ? "border-line bg-muted"
                    : "border-primary/40 bg-secondary"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-ink">
                    ✨ Prepared for {qd.date}
                    {qd.date === today ? " (today)" : ""} · {qd.kind}
                    {qd.refSlug ? ` · ${qd.refSlug}` : ""}
                    {qd.status === "posted" ? " · posted ✓" : ""}
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{qd.caption}</p>
                </div>
                {qd.status !== "posted" && (
                  <button
                    onClick={() => loadQueued(qd)}
                    className="btn-clay shrink-0 px-3 py-1.5 text-xs text-white"
                  >
                    Load
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.suggestions.onSale.map((slug) => {
            const it = itemById.get(slug);
            if (!it) return null;
            return (
              <button
                key={slug}
                onClick={() => {
                  setKind("deal");
                  setDealSlug(slug);
                }}
                className={chip(kind === "deal" && dealSlug === slug)}
              >
                🔥 {it.savingsPercent}% off — {it.brand ?? it.name}
              </button>
            );
          })}
          {data.suggestions.valuePickOfDay && itemById.get(data.suggestions.valuePickOfDay) && (
            <button
              onClick={() => {
                setKind("deal");
                setDealSlug(data.suggestions.valuePickOfDay!);
              }}
              className={chip(kind === "deal" && dealSlug === data.suggestions.valuePickOfDay)}
            >
              💎 Value pick of the day — {itemById.get(data.suggestions.valuePickOfDay)!.brand ?? itemById.get(data.suggestions.valuePickOfDay)!.name}
            </button>
          )}
          {data.suggestions.latestPost && postBySlug.get(data.suggestions.latestPost) && (
            <button
              onClick={() => {
                setKind("blog");
                setPostSlug(data.suggestions.latestPost!);
              }}
              className={chip(kind === "blog" && postSlug === data.suggestions.latestPost)}
            >
              📝 Latest post — {postBySlug.get(data.suggestions.latestPost)!.title.slice(0, 40)}
            </button>
          )}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(20rem,24rem)]">
        {/* Left: content selection + caption */}
        <div className="flex flex-col gap-4">
          {/* Kind tabs */}
          <div className="flex items-center gap-1 self-start rounded-lg border border-line bg-white p-1">
            {(["deal", "blog", "custom"] as Kind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`rounded-md px-3 py-1.5 text-sm font-bold capitalize ${
                  kind === k ? "bg-primary text-primary-foreground" : "text-ink hover:bg-secondary"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {kind === "deal" && (
            <section className="rounded-xl border border-line bg-white p-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${data.items.length} products…`}
                className={input}
              />
              <div className="mt-2 max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-line">
                {filteredItems.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setDealSlug(i.id)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary ${
                      i.id === dealSlug ? "bg-secondary" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">
                        {i.brand ? `${i.brand} — ` : ""}
                        {i.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {i.categoryShort} · {usd(i.priceCents)} · {i.per10g}/10g
                        {!i.hasImage && " · no photo"}
                      </span>
                    </span>
                    {(i.savingsPercent ?? 0) > 0 && (
                      <span className="shrink-0 rounded-full bg-[color:var(--color-gold-soft)] px-2 py-0.5 text-xs font-bold text-[color:var(--color-gold)]">
                        -{i.savingsPercent}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {kind === "blog" && (
            <section className="rounded-xl border border-line bg-white p-4">
              {data.posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No published posts yet — write one in the Content tab.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {data.posts.map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => setPostSlug(p.slug)}
                      className={`rounded-md px-3 py-2 text-left text-sm hover:bg-secondary ${
                        p.slug === postSlug ? "bg-secondary" : ""
                      }`}
                    >
                      <span className="block font-semibold text-ink">{p.title}</span>
                      <span className="text-xs text-muted-foreground">/{p.slug}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {kind === "custom" && (
            <section className="grid gap-3 rounded-xl border border-line bg-white p-4">
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline, e.g. Eggs are still the cheapest protein in the store"
                className={input}
              />
              <input
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                placeholder="Supporting line (optional)"
                className={input}
              />
              <input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Corner badge, e.g. Protein 101 (optional)"
                className={input}
              />
            </section>
          )}

          {/* Caption */}
          <section className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-ink">Caption</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={aiCaption}
                  disabled={busy || !caption}
                  className="btn-soft flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  <Sparkles className="size-3.5" /> AI rewrite
                </button>
                <button
                  onClick={copyCaption}
                  disabled={!caption}
                  className="btn-soft flex items-center gap-1.5 px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={9}
              className={`${input} mt-2 text-xs leading-relaxed`}
            />
          </section>
        </div>

        {/* Right: preview + actions */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                title={s.dims}
                className={chip(size === s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-line bg-white p-3">
            {cardUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={cardUrl}
                src={cardUrl}
                alt="Card preview"
                className="w-full rounded-lg border border-line"
              />
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Pick content to preview the card.
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={download}
              disabled={busy || !cardUrl}
              className="btn-clay flex items-center gap-1.5 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              <Download className="size-4" /> Download PNG
            </button>
            <button
              onClick={markPosted}
              disabled={busy || !caption}
              className="btn-soft flex items-center gap-1.5 px-4 py-2 text-sm disabled:opacity-50"
            >
              <Check className="size-4" /> Mark as posted
            </button>
            <button
              onClick={() => void load()}
              disabled={busy}
              className="btn-soft flex items-center gap-1.5 px-3 py-2 text-sm disabled:opacity-50"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
          {note && (
            <p className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-[color:var(--color-leaf-deep)]">
              {note}
            </p>
          )}

          {/* History */}
          <section>
            <h3 className="mb-1.5 font-heading text-base font-bold text-ink">Recent posts</h3>
            {data.recent.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line p-3 text-xs text-muted-foreground">
                Nothing recorded yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {data.recent.map((r) => (
                  <li key={r.id} className="rounded-lg border border-line bg-white px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold capitalize text-ink">
                        {r.kind}
                        {r.refSlug ? ` · ${r.refSlug}` : ""}
                      </span>
                      <span className="tabular shrink-0 text-muted-foreground">{r.date}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{r.caption}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
