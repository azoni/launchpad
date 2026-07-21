import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { getCollectionItems } from "@/lib/catalog";
import {
  COLLECTIONS,
  COLLECTION_BY_SLUG,
} from "@/lib/catalog/collections";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  itemListJsonLd,
} from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 21600;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = COLLECTION_BY_SLUG[slug];
  if (!c) return {};
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `${APP_URL}/best/${slug}` },
    openGraph: { title: c.title, description: c.description },
  };
}

export default async function BestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = COLLECTION_BY_SLUG[slug];
  if (!c) notFound();

  const items = await getCollectionItems(c.filter, {
    sort: slug === "high-protein-low-calorie" ? "density" : "value",
    limit: c.limit,
  });

  const otherCollections = COLLECTIONS.filter((x) => x.slug !== slug).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Rankings", path: "/" },
          { name: c.title, path: `/best/${slug}` },
        ])}
      />
      <JsonLd data={itemListJsonLd(items, c.title)} />
      <JsonLd data={faqJsonLd(c.faqs)} />

      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Rankings
        </Link>{" "}
        / <span className="text-ink">Best of</span>
      </nav>

      <h1 className="max-w-3xl font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {c.title}
      </h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
        {c.intro}
      </p>

      {items.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-line p-8 text-center text-muted-foreground">
          No matching items right now.{" "}
          <Link href="/" className="font-semibold text-primary">
            Browse the full ranking
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((it, i) => (
            <ProductCard key={it.id} item={it} rank={i + 1} source="collection" />
          ))}
        </div>
      )}

      {/* FAQ (mirrors FAQPage JSON-LD) */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold text-ink">
          Frequently asked
        </h2>
        <dl className="mt-3 divide-y divide-border rounded-xl border border-line bg-white">
          {c.faqs.map((f) => (
            <div key={f.q} className="p-4">
              <dt className="font-semibold text-ink">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* More lists — internal-link hub */}
      <section className="mt-12">
        <h2 className="font-heading text-xl font-bold text-ink">More lists</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherCollections.map((x) => (
            <Link
              key={x.slug}
              href={`/best/${x.slug}`}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-secondary"
            >
              {x.title}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Or see the{" "}
          <Link href="/" className="font-semibold text-primary">
            full protein value leaderboard <ArrowRight className="inline size-3" />
          </Link>
        </p>
      </section>
    </div>
  );
}
