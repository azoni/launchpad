import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, MessageCircle, Tag } from "lucide-react";
import { Leaderboard } from "@/components/Leaderboard";
import { JsonLd } from "@/components/JsonLd";
import { getAllItems } from "@/lib/catalog";
import {
  itemListJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: APP_URL },
};

export default async function HomePage() {
  const items = await getAllItems();
  const cheapest = items.find(
    (i) => i.metrics.costPerGramProteinCents != null,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={itemListJsonLd(items, "Cheapest protein by dollars per gram")} />

      {/* Hero — compact, deal-forward */}
      <section className="mb-6 pt-2 text-center sm:pt-4">
        <h1 className="mx-auto max-w-2xl font-display text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[2.7rem]">
          The best <span className="italic text-clay">deals on protein</span>.
        </h1>
        <p className="mx-auto mt-2.5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          {items.length} powders, bars, snacks, and whole foods ranked by value —
          the most protein for your money.
          {cheapest && (
            <>
              {" "}
              Best deal right now:{" "}
              <Link
                href={`/food/${cheapest.id}`}
                className="font-semibold text-ink underline decoration-clay/50 decoration-2 underline-offset-2 hover:decoration-clay"
              >
                {cheapest.name}
              </Link>
              .
            </>
          )}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          <Link href="/deals" className="btn-clay px-4 py-2 text-sm text-white">
            <Tag className="size-4" /> Today&apos;s best deals
          </Link>
          <Link href="/calculator" className="btn-soft px-4 py-2 text-sm">
            <Calculator className="size-4" /> Protein calculator
          </Link>
          <Link href="/coach" className="btn-soft px-4 py-2 text-sm">
            <MessageCircle className="size-4" /> AI coach
          </Link>
        </div>
      </section>

      {/* Themed collections → AI coach */}
      <section className="mb-6 rounded-xl border border-line bg-white p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">
            Ask the coach:
          </span>
          {[
            { emoji: "🥾", label: "Backpacking", q: "Best high-protein snacks for backpacking" },
            { emoji: "💼", label: "Office (no fridge)", q: "Office-friendly protein snacks with no fridge" },
            { emoji: "💪", label: "Post-workout", q: "Cheapest post-workout protein" },
            { emoji: "✈️", label: "Travel", q: "High-protein snacks for travel" },
            { emoji: "🌱", label: "Vegan", q: "Best vegan protein snacks" },
          ].map((t) => (
            <Link
              key={t.label}
              href={`/coach?q=${encodeURIComponent(t.q)}`}
              className="rounded-full border border-line bg-secondary px-3 py-1.5 text-xs font-semibold text-[color:var(--color-leaf-deep)] transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {t.emoji} {t.label}
            </Link>
          ))}
          <span className="text-xs text-muted-foreground">
            …or ask your own
          </span>
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <Leaderboard items={items} />
      </section>

      {/* Methodology teaser (GEO intro) */}
      <section className="mt-12 rounded-xl border border-line bg-white p-6">
        <h2 className="font-heading text-xl font-bold text-ink">
          How the ranking works
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          For every food we take its price and divide by the total grams of
          protein in the package — so a $70 tub of whey with 1,700 g of protein
          costs about $0.04 per gram, while a $3 dozen eggs works out to a similar
          value. Whole foods like chicken breast, eggs, canned tuna, and lentils
          almost always beat supplements on price per gram; bars, jerky, and
          ready-to-drink shakes cost the most for the convenience. Prices are
          curated estimates you should verify on Amazon; protein figures come from
          product labels and USDA FoodData Central.{" "}
          <Link href="/about" className="font-semibold text-primary">
            Read the full methodology <ArrowRight className="inline size-3" />
          </Link>
        </p>
      </section>
    </div>
  );
}
