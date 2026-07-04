import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "How MacroMarket Works — Our Methodology",
  description:
    "How MacroMarket calculates dollars per gram of protein, where our nutrition and price data comes from, and how we make money.",
  alternates: { canonical: `${APP_URL}/about` },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "How MacroMarket Works",
          url: `${APP_URL}/about`,
        }}
      />
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        How MacroMarket works
      </h1>

      <div className="mt-6 space-y-6 text-muted-foreground">
        <section>
          <h2 className="font-heading text-xl font-bold text-ink">
            The one number that matters
          </h2>
          <p className="mt-2 leading-relaxed">
            MacroMarket ranks foods by a single metric: the cost of one gram of
            protein. We take a product&apos;s price and divide it by the total
            grams of protein in the package. A $70 tub of whey with about 1,700 g
            of protein costs roughly $0.04 per gram; a dozen eggs lands in a
            similar place. This lets you compare a protein bar, a scoop of whey,
            and a chicken breast on equal footing.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-ink">
            Where the data comes from
          </h2>
          <p className="mt-2 leading-relaxed">
            Protein and calorie figures are curated from product nutrition labels
            and the USDA FoodData Central database. Prices are curated estimates,
            captured on a date shown next to each price, and should be treated as a
            starting point — always confirm the live price on Amazon before you
            buy. When live pricing is available for our account, prices and deals
            update automatically.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-ink">
            Whole foods usually win
          </h2>
          <p className="mt-2 leading-relaxed">
            We include both packaged products (protein powder, bars, shakes, jerky)
            and whole foods (chicken, eggs, canned tuna, lentils, tofu). We&apos;re
            honest about the result: whole foods almost always deliver the cheapest
            protein per gram, and supplements cost more for convenience and taste.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-xl font-bold text-ink">
            How we make money
          </h2>
          <p className="mt-2 leading-relaxed">
            MacroMarket is free. When you buy through our links we may earn an
            Amazon affiliate commission at no extra cost to you. That never changes
            a food&apos;s ranking — the ranking is purely the math on price per
            gram of protein. See our{" "}
            <Link href="/disclosure" className="font-semibold text-primary">
              affiliate disclosure
            </Link>
            .
          </p>
        </section>
      </div>

      <p className="mt-8 text-sm">
        <Link href="/" className="font-semibold text-primary">
          ← Back to the leaderboard
        </Link>
      </p>
    </div>
  );
}
