import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductRow } from "@/components/ProductRow";
import { JsonLd } from "@/components/JsonLd";
import { getItemsByCategory } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/catalog/categories";
import type { CategorySlug } from "@/lib/catalog/types";
import { formatCostPerGram } from "@/lib/format";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 21600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

function getMeta(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = getMeta(slug);
  if (!cat) return {};
  const title = `${cat.name} — Cheapest by $/g Protein`;
  return {
    title,
    description: `${cat.blurb} Ranked by dollars per gram of protein.`,
    alternates: { canonical: `${APP_URL}/category/${cat.slug}` },
    openGraph: { title, description: cat.blurb },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getMeta(slug);
  if (!cat) notFound();

  const items = await getItemsByCategory(slug as CategorySlug);
  const best = items.find((i) => i.metrics.costPerGramProteinCents != null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Rankings", path: "/" },
          { name: cat.name, path: `/category/${cat.slug}` },
        ])}
      />
      <JsonLd data={itemListJsonLd(items, cat.name)} />

      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Rankings
        </Link>{" "}
        / <span className="text-ink">{cat.short}</span>
      </nav>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        {cat.name}
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">{cat.blurb}</p>
      {best && (
        <p className="mt-2 text-sm text-muted-foreground">
          Best value in this category:{" "}
          <Link
            href={`/food/${best.id}`}
            className="font-semibold text-ink underline decoration-primary decoration-2 underline-offset-2"
          >
            {best.name}
          </Link>{" "}
          at{" "}
          <span className="tabular font-bold text-primary">
            {formatCostPerGram(best.metrics.costPerGramProteinCents)}/g
          </span>
          .
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {items.map((it, i) => (
          <ProductRow key={it.id} item={it} rank={i + 1} source="category" />
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-heading text-lg font-bold text-ink">
          Other categories
        </h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-secondary"
            >
              {c.short}
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Not sure how much protein you need?{" "}
          <Link href="/calculator" className="font-semibold text-primary">
            Use the protein calculator
          </Link>{" "}
          to get a daily target and the cheapest basket to hit it.
        </p>
      </section>
    </div>
  );
}
