import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/BuyButton";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { JsonLd } from "@/components/JsonLd";
import { getItemBySlug, seedBySlug } from "@/lib/catalog";
import { allComparePairs } from "@/lib/catalog/autoCompares";
import { CATEGORY_BY_SLUG } from "@/lib/catalog/categories";
import type { CatalogItem } from "@/lib/catalog/types";
import {
  formatDensity,
  formatDose,
  formatPer10g,
  formatPrice,
} from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 21600;

export function generateStaticParams() {
  return allComparePairs().map(([a, b]) => ({ slug: `${a}-vs-${b}` }));
}

/** Up to `n` other comparisons that share a product with this pair. */
function relatedPairs(a: string, b: string, n = 6): [string, string][] {
  return allComparePairs()
    .filter(
      ([x, y]) =>
        !(x === a && y === b) &&
        !(x === b && y === a) &&
        (x === a || x === b || y === a || y === b),
    )
    .slice(0, n);
}

function parse(slug: string): [string, string] | null {
  const parts = slug.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pair = parse(slug);
  if (!pair) return {};
  const [a, b] = await Promise.all([getItemBySlug(pair[0]), getItemBySlug(pair[1])]);
  if (!a || !b) return {};
  const title = `${a.name} vs ${b.name}: Cost per Gram of Protein`;
  return {
    title,
    description: `Which is the better protein value — ${a.name} or ${b.name}? A side-by-side comparison of dollars per gram of protein, protein density, and cost per serving.`,
    alternates: { canonical: `${APP_URL}/compare/${slug}` },
  };
}

function Column({ item }: { item: CatalogItem }) {
  const m = item.metrics;
  const rows: [string, string][] = [
    ["Per 10g protein", formatPer10g(m.costPerGramProteinCents)],
    ["Per 20 g dose", formatDose(m.proteinDosePriceCents)],
    ["Price / serving", formatPrice(m.pricePerServingCents)],
    ["Protein / serving", `${item.proteinPerServing_g} g`],
    ["Protein density", formatDensity(m.proteinDensity)],
    ["Sticker price", formatPrice(item.effectivePriceCents)],
  ];
  return (
    <div className="price-tag-card flex-1 p-5">
      <PlaceholderImage
        category={item.category}
        imageUrl={item.imageUrl}
        alt={item.imageAlt}
        className="mb-3 h-20 w-20 rounded-lg border border-line"
      />
      <Link
        href={`/food/${item.id}`}
        className="font-heading text-lg font-bold text-ink hover:text-primary"
      >
        {item.name}
      </Link>
      <dl className="mt-3 divide-y divide-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1.5">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="tabular text-sm font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <BuyButton
          slug={item.id}
          asin={item.asin}
          buyUrl={item.buyUrl}
          source="compare"
          label="Buy on Amazon"
          variant="small"
        />
      </div>
    </div>
  );
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pair = parse(slug);
  if (!pair) notFound();
  const [a, b] = await Promise.all([
    getItemBySlug(pair[0]),
    getItemBySlug(pair[1]),
  ]);
  if (!a || !b) notFound();

  const ca = a.metrics.costPerGramProteinCents;
  const cb = b.metrics.costPerGramProteinCents;
  let verdict = "These two are about the same value per gram of protein.";
  let pct = 0;
  let cheaper: CatalogItem | null = null;
  if (ca != null && cb != null && ca !== cb) {
    cheaper = ca < cb ? a : b;
    const dearer = ca < cb ? b : a;
    pct = Math.round((Math.abs(ca - cb) / Math.max(ca, cb)) * 100);
    verdict = `${cheaper.name} is the better value — about ${pct}% cheaper per gram of protein than ${dearer.name}.`;
  }

  const related = relatedPairs(pair[0], pair[1]);
  const faqs = [
    {
      q: `Is ${a.name} or ${b.name} cheaper per gram of protein?`,
      a:
        cheaper != null
          ? `${cheaper.name} is cheaper per gram of protein — about ${pct}% less than the other option based on current prices. We rank protein by cost per 10 g so you can see which stretches your money further.`
          : `${a.name} and ${b.name} work out to roughly the same cost per gram of protein at current prices.`,
    },
    {
      q: `How much protein does ${a.name} have vs ${b.name}?`,
      a: `${a.name} has ${a.proteinPerServing_g} g of protein per serving; ${b.name} has ${b.proteinPerServing_g} g per serving. Cost per gram of protein also depends on price and how many servings are in the package.`,
    },
    {
      q: "How is protein value calculated?",
      a: "We take each product's price and divide by the total grams of protein in the package, then show it as a cost per 10 g of protein so two very different foods can be compared on the same scale.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Rankings", path: "/" },
          { name: "Compare", path: "/compare" },
          { name: `${a.name} vs ${b.name}`, path: `/compare/${slug}` },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Rankings
        </Link>{" "}
        / <span className="text-ink">Compare</span>
      </nav>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        {a.name} <span className="text-muted-foreground">vs</span> {b.name}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        A side-by-side look at {a.name} and {b.name} on the one number that matters
        for your wallet — cost per gram of protein — plus protein per serving,
        calories, and sticker price. Prices are the latest we have; verify on
        Amazon before buying.
      </p>
      <p className="mt-3 rounded-lg border border-line bg-accent/30 p-3 text-sm font-semibold text-ink">
        🏆 {verdict}
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <Column item={a} />
        <Column item={b} />
      </div>

      {/* Related comparisons — internal-link web for crawl + long-tail reach */}
      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-lg font-bold text-ink">
            Related comparisons
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map(([x, y]) => {
              const sx = seedBySlug(x);
              const sy = seedBySlug(y);
              if (!sx || !sy) return null;
              return (
                <Link
                  key={`${x}-vs-${y}`}
                  href={`/compare/${x}-vs-${y}`}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-secondary"
                >
                  {sx.name} vs {sy.name}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ (mirrors FAQPage JSON-LD) */}
      <section className="mt-10">
        <h2 className="font-heading text-lg font-bold text-ink">
          {a.name} vs {b.name}: FAQ
        </h2>
        <dl className="mt-3 divide-y divide-border rounded-xl border border-line bg-white">
          {faqs.map((f) => (
            <div key={f.q} className="p-4">
              <dt className="font-semibold text-ink">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        See the full{" "}
        <Link href="/" className="font-semibold text-primary">
          protein value leaderboard
        </Link>
        , browse{" "}
        <Link
          href={`/category/${a.category}`}
          className="font-semibold text-primary"
        >
          {CATEGORY_BY_SLUG[a.category].short.toLowerCase()}
        </Link>
        , or{" "}
        <Link href="/calculator" className="font-semibold text-primary">
          calculate your daily protein goal
        </Link>
        .
      </p>
    </div>
  );
}
