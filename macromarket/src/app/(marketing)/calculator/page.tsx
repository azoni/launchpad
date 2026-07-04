import type { Metadata } from "next";
import Link from "next/link";
import { ProteinCalculator } from "@/components/ProteinCalculator";
import { JsonLd } from "@/components/JsonLd";
import { getAllItems } from "@/lib/catalog";
import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/utils";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Protein Goal Calculator — Cheapest Way to Hit Your Target",
  description:
    "Enter your body weight and goal to get a daily protein target, then see the cheapest foods and a balanced basket to hit it — ranked by dollars per gram of protein.",
  alternates: { canonical: `${APP_URL}/calculator` },
};

export default async function CalculatorPage() {
  const items = await getAllItems();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: `${APP_NAME} Protein Calculator`,
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          url: `${APP_URL}/calculator`,
          description: APP_DESCRIPTION,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to hit your daily protein goal cheaply",
          step: [
            { "@type": "HowToStep", name: "Enter your body weight" },
            { "@type": "HowToStep", name: "Pick a goal (maintain, active, or build)" },
            { "@type": "HowToStep", name: "Get your daily protein target in grams" },
            { "@type": "HowToStep", name: "Buy the cheapest foods to hit it" },
          ],
        }}
      />

      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        Protein goal calculator
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Find out how much protein you need per day, then see the cheapest foods to
        hit that target — ranked by dollars per gram of protein. Every pick links
        straight to Amazon.
      </p>

      <div className="mt-6">
        <ProteinCalculator items={items} />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Want the full ranking?{" "}
        <Link href="/" className="font-semibold text-primary">
          Browse the protein value leaderboard
        </Link>{" "}
        or{" "}
        <Link href="/coach" className="font-semibold text-primary">
          ask the AI coach to build a plan
        </Link>
        .
      </p>
    </div>
  );
}
