import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/BuyButton";
import { ProductCard } from "@/components/ProductCard";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/JsonLd";
import { ViewBeacon } from "@/components/ViewBeacon";
import {
  allSlugs,
  getItemBySlug,
  getNeighbors,
  seedBySlug,
} from "@/lib/catalog";
import {
  CATEGORY_BY_SLUG,
  DIET_TAG_LABELS,
  FORM_LABELS,
} from "@/lib/catalog/categories";
import {
  formatAsOf,
  formatCostPerGram,
  formatDensity,
  formatDose,
  formatGrams,
  formatPer10g,
  formatPrice,
} from "@/lib/format";
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 21600;

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seed = seedBySlug(slug);
  if (!seed) return {};
  const title = `${seed.name}${seed.brand ? ` (${seed.brand})` : ""} — Cost per Gram of Protein`;
  return {
    title,
    description: seed.editorialBlurb,
    alternates: { canonical: `${APP_URL}/food/${seed.id}` },
    openGraph: { title, description: seed.editorialBlurb },
  };
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`tabular text-xl font-bold ${highlight ? "text-primary" : "text-ink"}`}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default async function FoodPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItemBySlug(slug);
  if (!item) notFound();

  const neighbors = await getNeighbors(slug);
  const cat = CATEGORY_BY_SLUG[item.category];
  const m = item.metrics;

  const faqs = [
    {
      q: `How much does protein cost in ${item.name}?`,
      a: `${item.name} works out to about ${formatPer10g(
        m.costPerGramProteinCents,
      )} per 10 g of protein — roughly ${formatDose(
        m.proteinDosePriceCents,
      )} for a 20 g serving — based on an ${item.priceIsEstimate ? "estimated" : "live"} price of ${formatPrice(
        item.effectivePriceCents,
      )}.`,
    },
    {
      q: `How much protein is in ${item.name}?`,
      a: `${item.proteinPerServing_g} g of protein per ${item.servingSizeLabel}, or about ${formatGrams(
        m.totalProteinG,
      )} of protein in the whole ${item.packCount > 1 ? `${item.packCount}-pack` : "container"}.`,
    },
    {
      q: `Is ${item.name} a good protein value?`,
      a: `${item.editorialBlurb} Whole foods like chicken, eggs, canned tuna, and lentils usually cost the least per gram; supplements and bars cost more for convenience.`,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ViewBeacon slug={item.id} />
      <JsonLd data={productJsonLd(item)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Rankings", path: "/" },
          { name: cat.short, path: `/category/${item.category}` },
          { name: item.name, path: `/food/${item.id}` },
        ])}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Rankings
        </Link>{" "}
        /{" "}
        <Link href={`/category/${item.category}`} className="hover:text-primary">
          {cat.short}
        </Link>{" "}
        / <span className="text-ink">{item.name}</span>
      </nav>

      <div className="flex flex-col gap-6 sm:flex-row">
        <PlaceholderImage
          category={item.category}
          imageUrl={item.imageUrl}
          alt={item.imageAlt}
          className="h-32 w-32 shrink-0 rounded-xl border border-line"
        />
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
            {item.name}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {item.brand ? `${item.brand} · ` : ""}
            <Link
              href={`/category/${item.category}`}
              className="hover:text-primary"
            >
              {cat.name}
            </Link>
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="muted">{FORM_LABELS[item.form]}</Badge>
            {item.dietTags.map((d) => (
              <Badge key={d} variant="secondary">
                {DIET_TAG_LABELS[d]}
              </Badge>
            ))}
            {!item.inStock && <Badge variant="alert">Out of stock</Badge>}
          </div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {item.editorialBlurb}
          </p>
        </div>
      </div>

      {/* Metric grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          label="Cost per 10g protein"
          value={formatPer10g(m.costPerGramProteinCents)}
          sub="the MacroMarket metric"
          highlight
        />
        <Stat
          label="Per 20 g dose"
          value={formatDose(m.proteinDosePriceCents)}
          sub="a typical protein serving"
        />
        <Stat
          label="Price per serving"
          value={formatPrice(m.pricePerServingCents)}
          sub={item.servingSizeLabel}
        />
        <Stat
          label="Protein / serving"
          value={formatGrams(item.proteinPerServing_g)}
          sub={`${item.calories} kcal`}
        />
        <Stat
          label="Protein density"
          value={formatDensity(m.proteinDensity)}
          sub="protein per 100 kcal"
        />
        <Stat
          label="Protein / package"
          value={formatGrams(m.totalProteinG)}
          sub={`${item.servingsPerContainer} servings`}
        />
      </div>

      {/* Buy + price disclosure */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-secondary p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="tabular text-2xl font-bold text-ink">
            {formatPrice(item.effectivePriceCents)}{" "}
            <span className="text-sm font-semibold text-muted-foreground">
              {item.priceIsEstimate
                ? `est. · as of ${formatAsOf(item.priceAsOf)}`
                : "live price"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {item.priceIsEstimate
              ? "Estimated for comparison — confirm the current price on Amazon."
              : "Live from Amazon."}
          </p>
          {item.priceSuspect && (
            <p className="mt-1 text-xs font-medium text-[color:var(--color-berry)]">
              The live listing looked like a different pack size, so we&apos;re
              showing our estimate — flagged for review.
            </p>
          )}
        </div>
        <BuyButton
          slug={item.id}
          asin={item.asin}
          buyUrl={item.buyUrl}
          source="detail"
          label="Buy on Amazon"
        />
      </div>

      {/* How it's calculated */}
      <section className="mt-6 rounded-xl border border-line bg-white p-5">
        <h2 className="font-heading text-lg font-bold text-ink">
          How we got {formatPer10g(m.costPerGramProteinCents)} per 10g
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Price ({formatPrice(item.effectivePriceCents)}) ÷ total protein in the
          package ({item.servingsPerContainer} servings ×{" "}
          {item.proteinPerServing_g} g = {formatGrams(m.totalProteinG)}) ={" "}
          <span className="tabular font-semibold text-ink">
            {formatCostPerGram(m.costPerGramProteinCents)}
          </span>{" "}
          per gram, or{" "}
          <span className="tabular font-semibold text-ink">
            {formatPer10g(m.costPerGramProteinCents)}
          </span>{" "}
          per 10 g of protein.
        </p>
      </section>

      {/* Compare to neighbors */}
      {neighbors.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-xl font-bold text-ink">
            Compare to similar-value options
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {neighbors.map((n) => (
              <ProductCard key={n.id} item={n} source="compare" />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="mt-8">
        <h2 className="mb-3 font-heading text-xl font-bold text-ink">
          Frequently asked
        </h2>
        <div className="flex flex-col gap-3">
          {faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-lg border border-line bg-white p-4"
            >
              <h3 className="font-semibold text-ink">{f.q}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/calculator" className="font-semibold text-primary">
          Build a full day of protein →
        </Link>{" "}
        or{" "}
        <Link href="/coach" className="font-semibold text-primary">
          ask the AI coach for cheaper swaps →
        </Link>
      </p>
    </div>
  );
}
