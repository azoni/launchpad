import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogContent } from "@/components/BlogContent";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getPostBySlug } from "@/lib/blog";
import { APP_NAME, APP_URL } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${APP_URL}/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
    },
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || post.status !== "published") notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${slug}` },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt ?? post.createdAt ?? undefined,
          dateModified: post.updatedAt ?? undefined,
          author: { "@type": "Organization", name: APP_NAME },
          publisher: { "@type": "Organization", name: APP_NAME },
          mainEntityOfPage: `${APP_URL}/blog/${slug}`,
        }}
      />

      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/blog" className="hover:text-primary">
          Blog
        </Link>{" "}
        / <span className="text-ink">{post.title}</span>
      </nav>

      {post.tag && (
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-[color:var(--color-leaf-deep)]">
          {post.tag}
        </span>
      )}
      <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-ink">
        {post.title}
      </h1>
      {fmtDate(post.publishedAt) && (
        <p className="mt-2 text-sm text-muted-foreground">
          {fmtDate(post.publishedAt)}
        </p>
      )}

      <div className="mt-6">
        <BlogContent markdown={post.body} />
      </div>

      <div className="mt-10 rounded-xl border border-line bg-secondary p-5">
        <p className="text-sm font-semibold text-ink">
          See the cheapest protein for your money
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Every food ranked by price per 10g of protein.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/" className="btn-clay px-4 py-2 text-sm text-white">
            Browse the leaderboard
          </Link>
          <Link href="/coach" className="btn-soft px-4 py-2 text-sm">
            Ask the AI coach
          </Link>
        </div>
      </div>
    </article>
  );
}
