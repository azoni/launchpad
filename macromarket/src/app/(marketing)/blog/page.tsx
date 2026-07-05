import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { getPublishedPosts } from "@/lib/blog";
import { APP_NAME, APP_URL } from "@/lib/utils";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Protein Value Blog",
  description:
    "Data-driven guides to the cheapest protein — cost-per-gram breakdowns, buying guides, and value comparisons from the MacroMarket catalog of 187 foods.",
  alternates: { canonical: `${APP_URL}/blog` },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Blog",
          name: `${APP_NAME} Blog`,
          url: `${APP_URL}/blog`,
          description: metadata.description,
        }}
      />
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        Protein value blog
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Straight-talking, data-backed guides to getting the most protein for your
        money — built on the same cost-per-gram rankings that power the site.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-line p-8 text-center text-muted-foreground">
          No posts yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="price-tag-card is-interactive block p-5"
            >
              {p.tag && (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-[color:var(--color-leaf-deep)]">
                  {p.tag}
                </span>
              )}
              <h2 className="mt-2 font-heading text-xl font-bold text-ink">
                {p.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary">
                {fmtDate(p.publishedAt) && (
                  <span className="text-muted-foreground">
                    {fmtDate(p.publishedAt)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  Read <ArrowRight className="size-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        Prefer the data?{" "}
        <Link href="/" className="font-semibold text-primary">
          Browse the full protein value leaderboard
        </Link>
        .
      </p>
    </div>
  );
}
