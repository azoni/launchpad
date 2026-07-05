import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/BuyButton";
import { PlaceholderImage } from "@/components/PlaceholderImage";
import { JsonLd } from "@/components/JsonLd";
import { getItemBySlug } from "@/lib/catalog";
import { COMPARE_PAIRS } from "@/lib/catalog/compares";
import type { CatalogItem } from "@/lib/catalog/types";
import {
  formatDensity,
  formatDose,
  formatPer10g,
  formatPrice,
} from "@/lib/format";
import { breadcrumbJsonLd } from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 21600;

export function generateStaticParams() {
  return COMPARE_PAIRS.map(([a, b]) => ({ slug: `${a}-vs-${b}` }));
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
  if (ca != null && cb != null && ca !== cb) {
    const cheaper = ca < cb ? a : b;
    const dearer = ca < cb ? b : a;
    const pct = Math.round((Math.abs(ca - cb) / Math.max(ca, cb)) * 100);
    verdict = `${cheaper.name} is the better value — about ${pct}% cheaper per gram of protein than ${dearer.name}.`;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Rankings", path: "/" },
          { name: `${a.name} vs ${b.name}`, path: `/compare/${slug}` },
        ])}
      />
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Rankings
        </Link>{" "}
        / <span className="text-ink">Compare</span>
      </nav>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        {a.name} <span className="text-muted-foreground">vs</span> {b.name}
      </h1>
      <p className="mt-3 rounded-lg border border-line bg-accent/30 p-3 text-sm font-semibold text-ink">
        🏆 {verdict}
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <Column item={a} />
        <Column item={b} />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        See the full{" "}
        <Link href="/" className="font-semibold text-primary">
          protein value leaderboard
        </Link>{" "}
        or{" "}
        <Link href="/calculator" className="font-semibold text-primary">
          calculate your daily protein goal
        </Link>
        .
      </p>
    </div>
  );
}
