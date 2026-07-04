import type { Metadata } from "next";
import Link from "next/link";
import { Tag } from "lucide-react";
import { ProductRow } from "@/components/ProductRow";
import { JsonLd } from "@/components/JsonLd";
import { getDeals } from "@/lib/catalog";
import { itemListJsonLd } from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Protein Deals & Best Values",
  description:
    "The best protein deals ranked by dollars per gram — live Amazon sale prices plus the best-value pick in every category, from whey and bars to chicken and lentils.",
  alternates: { canonical: `${APP_URL}/deals` },
};

export default async function DealsPage() {
  const { onSale, bestValue, hasLiveDeals } = await getDeals();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <JsonLd data={itemListJsonLd(bestValue, "Best protein value deals")} />

      <div className="inline-flex items-center gap-2 rounded-full border border-line bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
        <Tag className="size-3.5" /> Deals
      </div>
      <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-ink">
        Protein deals &amp; best values
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        The cheapest protein per gram, updated regularly. Live Amazon sale prices
        show up here automatically once the store is connected — for now these are
        the best value-per-gram picks in every category.
      </p>

      {hasLiveDeals && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-2xl font-bold text-ink">
            🔥 On sale now
          </h2>
          <div className="flex flex-col gap-3">
            {onSale.map((it, i) => (
              <ProductRow key={it.id} item={it} rank={i + 1} source="leaderboard" />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-1 font-heading text-2xl font-bold text-ink">
          Best value in every category
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The single cheapest-per-gram protein in each aisle — the best deal
          whether or not it&apos;s technically &ldquo;on sale.&rdquo;
        </p>
        <div className="flex flex-col gap-3">
          {bestValue.map((it, i) => (
            <ProductRow key={it.id} item={it} rank={i + 1} source="leaderboard" />
          ))}
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        See every food on the{" "}
        <Link href="/" className="font-semibold text-primary">
          full leaderboard
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
