import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { getAllItems } from "@/lib/catalog";
import { CATEGORY_BY_SLUG } from "@/lib/catalog/categories";
import { buildPriceIndex } from "@/lib/catalog/priceIndex";
import { formatPer10g } from "@/lib/format";
import { breadcrumbJsonLd } from "@/lib/seo";
import { APP_NAME, APP_URL } from "@/lib/utils";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "The Protein Price Index — Cost of Protein by Category",
  description:
    "Original data: the median cost per gram of protein across hundreds of foods and supplements, broken down by category, updated with live prices.",
  alternates: { canonical: `${APP_URL}/price-index` },
  openGraph: {
    title: "The Protein Price Index",
    description:
      "The median cost per gram of protein across hundreds of foods and supplements, by category.",
  },
};

export default async function PriceIndexPage() {
  const items = await getAllItems();
  const idx = buildPriceIndex(items);
  const asOf = new Date(idx.generatedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Dataset JSON-LD — signals to search engines this is citable original data.
  const datasetLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "MacroMarket Protein Price Index",
    description: `Median cost per gram of protein across ${idx.pricedItems} foods and supplements, by category, as of ${asOf}.`,
    url: `${APP_URL}/price-index`,
    creator: { "@type": "Organization", name: APP_NAME, url: APP_URL },
    dateModified: idx.generatedAt.slice(0, 10),
    variableMeasured: "Cost per gram of protein (USD)",
    keywords: [
      "protein price",
      "cost per gram of protein",
      "protein value",
      "cheapest protein",
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Rankings", path: "/" },
          { name: "Protein Price Index", path: "/price-index" },
        ])}
      />
      <JsonLd data={datasetLd} />

      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Rankings
        </Link>{" "}
        / <span className="text-ink">Protein Price Index</span>
      </nav>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        The Protein Price Index
      </h1>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
        How much does protein actually cost? We track {idx.pricedItems} foods and
        supplements and rank them by cost per gram of protein. As of {asOf}, the{" "}
        <strong className="text-ink">
          median across the whole catalog is {formatPer10g(idx.medianCentsPerGram)}{" "}
          per 10 g of protein
        </strong>
        {" "}— but it ranges from pennies for dry beans and eggs to well over a
        dollar for premium bars and jerky. Here&apos;s the breakdown by category.
      </p>

      {/* Headline stat tiles */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Foods tracked", String(idx.pricedItems)],
          ["Median /10g", formatPer10g(idx.medianCentsPerGram)],
          ["Cheapest /10g", formatPer10g(idx.cheapest[0]?.cheapestCentsPerGram ?? 0)],
          ["Categories", String(idx.cheapest.length)],
        ].map(([label, value]) => (
          <div key={label} className="price-tag-card p-4">
            <div className="text-xs font-semibold text-muted-foreground">
              {label}
            </div>
            <div className="tabular mt-1 text-2xl font-bold text-ink">{value}</div>
          </div>
        ))}
      </div>

      {/* By-category table */}
      <section className="mt-8">
        <h2 className="mb-2 font-heading text-xl font-bold text-ink">
          Median protein price by category
        </h2>
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="border-b border-line text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Category</th>
                <th className="px-3 py-2 text-right font-semibold">Items</th>
                <th className="px-3 py-2 text-right font-semibold">Median /10g</th>
                <th className="px-3 py-2 text-right font-semibold">Cheapest /10g</th>
                <th className="px-3 py-2 font-semibold">Best value pick</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {idx.cheapest.map((r) => (
                <tr key={r.category}>
                  <td className="px-3 py-2">
                    <Link
                      href={`/category/${r.category}`}
                      className="font-semibold text-ink hover:text-primary"
                    >
                      {CATEGORY_BY_SLUG[r.category].short}
                    </Link>
                  </td>
                  <td className="tabular px-3 py-2 text-right text-muted-foreground">
                    {r.count}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-semibold text-ink">
                    {formatPer10g(r.medianCentsPerGram)}
                  </td>
                  <td className="tabular px-3 py-2 text-right text-[color:var(--color-leaf-deep)]">
                    {formatPer10g(r.cheapestCentsPerGram)}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/food/${r.cheapest.id}`}
                      className="text-primary hover:underline"
                    >
                      {r.cheapest.name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top value overall */}
      <section className="mt-8">
        <h2 className="mb-2 font-heading text-xl font-bold text-ink">
          The 15 best protein values overall
        </h2>
        <ol className="divide-y divide-border rounded-xl border border-line bg-white">
          {idx.topValue.map((t, i) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="tabular w-6 shrink-0 text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <Link
                  href={`/food/${t.id}`}
                  className="truncate font-semibold text-ink hover:text-primary"
                >
                  {t.name}
                </Link>
              </span>
              <span className="tabular shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-sm font-bold text-[color:var(--color-leaf-deep)]">
                {formatPer10g(t.centsPerGram)}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Methodology (GEO — clear, quotable) */}
      <section className="mt-10 rounded-xl border border-line bg-white p-6">
        <h2 className="font-heading text-lg font-bold text-ink">Methodology</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          For every product we take its current price and divide by the total grams
          of protein in the package, giving a cost per gram of protein that we
          display as a price per 10 g. The category figures above are medians (the
          middle value), which resist distortion from a single unusually cheap or
          expensive item. Prices come from live Amazon data where available and
          curated estimates otherwise; protein figures come from manufacturer
          nutrition labels and USDA FoodData Central. Data updates continuously — cite
          it as &ldquo;{APP_NAME} Protein Price Index, {asOf}.&rdquo;
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Explore the underlying data:{" "}
          <Link href="/" className="font-semibold text-primary">
            full leaderboard <ArrowRight className="inline size-3" />
          </Link>
        </p>
      </section>
    </div>
  );
}
