import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";
import { APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Common questions about how MacroMarket ranks protein by cost per gram, where prices come from, and how much protein you need.",
  alternates: { canonical: `${APP_URL}/faq` },
};

const FAQS = [
  {
    q: "How is cost per gram of protein calculated?",
    a: "We divide a product's price by the total grams of protein in the whole package (servings per container × protein per serving). Lower is better value.",
  },
  {
    q: "Are the prices live?",
    a: "Prices are curated estimates captured on the date shown, meant for comparison. Always confirm the current price on Amazon before buying. When live Amazon pricing is enabled for our account, figures and deals update automatically.",
  },
  {
    q: "Is whole food really cheaper than protein powder?",
    a: "Usually, yes. Chicken breast, eggs, canned tuna, and dried lentils typically cost less per gram of protein than bars or ready-to-drink shakes, and are competitive with whey powder.",
  },
  {
    q: "How much protein do I need per day?",
    a: "A common guideline for active adults is about 0.7–1.0 g of protein per pound of body weight. Use our calculator to get a target and the cheapest foods to hit it. This is general guidance, not medical advice.",
  },
  {
    q: "Do you make money from recommendations?",
    a: "Yes — we earn an Amazon affiliate commission when you buy through our links, at no extra cost to you. It never affects the rankings, which are pure math on price per gram of protein.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={faqJsonLd(FAQS)} />
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        Frequently asked questions
      </h1>
      <div className="mt-6 flex flex-col gap-3">
        {FAQS.map((f) => (
          <div key={f.q} className="rounded-lg border border-line bg-white p-5">
            <h2 className="font-heading text-lg font-bold text-ink">{f.q}</h2>
            <p className="mt-1 text-muted-foreground">{f.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-sm">
        <Link href="/calculator" className="font-semibold text-primary">
          Try the protein calculator →
        </Link>
      </p>
    </div>
  );
}
