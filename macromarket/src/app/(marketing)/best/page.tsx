import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { COLLECTIONS } from "@/lib/catalog/collections";
import { breadcrumbJsonLd } from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Best Protein Value Lists",
  description:
    "Curated, data-backed lists of the best protein value — cheapest powders, vegan protein, keto snacks, high-protein low-calorie foods, and more.",
  alternates: { canonical: `${APP_URL}/best` },
};

export default function BestIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Rankings", path: "/" },
          { name: "Best of", path: "/best" },
        ])}
      />
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Rankings
        </Link>{" "}
        / <span className="text-ink">Best of</span>
      </nav>

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        Best protein value, by the list
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
        Hand-picked, data-backed rankings for the questions people actually ask —
        every list is sorted by cost per gram of protein (or protein per calorie),
        updated with live prices.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.slug}
            href={`/best/${c.slug}`}
            className="price-tag-card is-interactive block p-5"
          >
            <h2 className="font-heading text-lg font-bold text-ink">{c.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {c.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
