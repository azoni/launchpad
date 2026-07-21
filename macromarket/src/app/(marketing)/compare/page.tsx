import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { seedBySlug } from "@/lib/catalog";
import { allComparePairs } from "@/lib/catalog/autoCompares";
import { CATEGORY_BY_SLUG } from "@/lib/catalog/categories";
import type { CategorySlug } from "@/lib/catalog/types";
import { breadcrumbJsonLd } from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Protein Comparisons: Cost per Gram, Head to Head",
  description:
    "Side-by-side protein value comparisons — powders, bars, shakes, and whole foods matched up by cost per gram of protein.",
  alternates: { canonical: `${APP_URL}/compare` },
};

export default function CompareIndex() {
  const pairs = allComparePairs();

  // Group by the first item's category for a browsable index.
  const groups = new Map<CategorySlug, { slug: string; label: string }[]>();
  for (const [a, b] of pairs) {
    const sa = seedBySlug(a);
    const sb = seedBySlug(b);
    if (!sa || !sb) continue;
    const arr = groups.get(sa.category) ?? [];
    arr.push({ slug: `${a}-vs-${b}`, label: `${sa.name} vs ${sb.name}` });
    groups.set(sa.category, arr);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Rankings", path: "/" },
          { name: "Compare", path: "/compare" },
        ])}
      />
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Rankings
        </Link>{" "}
        / <span className="text-ink">Compare</span>
      </nav>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        Protein value comparisons
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        {pairs.length} head-to-head matchups ranked by the one number that matters
        for your budget — cost per gram of protein. Pick any two products to see
        which is the better deal.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {[...groups.entries()].map(([cat, list]) => (
          <section key={cat}>
            <h2 className="mb-2 font-heading text-lg font-bold text-ink">
              {CATEGORY_BY_SLUG[cat].short}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {list.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/compare/${p.slug}`}
                    className="inline-block rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-secondary"
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
