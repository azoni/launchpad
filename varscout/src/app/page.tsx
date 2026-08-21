import Link from "next/link";
import type { Metadata } from "next";
import { Screener } from "@/components/screener/Screener";
import { OMNI_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Carry screener for Variational Omni`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: `${SITE_NAME} — Carry screener for Variational Omni`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} tearsheet` }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "Independent research tooling for on-chain derivatives markets, built by azoni.ai.",
      sameAs: ["https://azoni.ai"],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "What does Varscout rank markets by?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Two ways, for two horizons. The default 'Now' view ranks by current activity — volume running above its baseline rate, price moving in standard-deviation terms, and open interest building — gated by whether a typical move covers the spread in your holding window. The 'Carry' view ranks longer holds by funding yield net of the amortized round-trip spread.",
          },
        },
        {
          "@type": "Question",
          name: "How does Varscout detect a volume spike without a trade feed?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The endpoint publishes no trade tape, so volume is inferred from the rolling 24-hour figure: its change per second estimates the rate trading is happening now. That rate is compared with a per-market baseline mean and standard deviation accumulated over days, and reported as a multiple of normal. Negative changes mean an old burst aged out of the trailing window rather than that trading stopped, so they are floored at zero.",
          },
        },
        {
          "@type": "Question",
          name: "Why is funding carry irrelevant for short trades on Omni?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Funding accrues continuously while the spread is paid once. One hour of a 50% annualized carry is about 0.006%, against a round-trip spread costing five to fifty times that. On a horizon of hours the price move has to justify the trade; carry only dominates over days.",
          },
        },
        {
          "@type": "Question",
          name: "Why does the top-ranked position change when I change position size?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Because the spread widens with size while the carry stays flat. In thin markets the round-trip cost can rise roughly tenfold between a $1,000 and a $100,000 clip, so a market that looks like the best trade small can fail to qualify at all when large.",
          },
        },
        {
          "@type": "Question",
          name: "Can Varscout place trades on Variational Omni?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Variational's trading API is not available yet — only a read-only market-statistics endpoint exists. Varscout identifies positions; execution is manual in the Omni interface.",
          },
        },
        {
          "@type": "Question",
          name: "What does PROVISIONAL mean on a row?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "That the row was scored from too few observations to judge whether its funding rate persists. The upstream endpoint publishes no history, so persistence and realized volatility can only be measured from data collected over time. Rows become CONFIRMED once enough readings accumulate.",
          },
        },
      ],
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <header className="mb-7 max-w-3xl">
          <p className="eyebrow">Variational Omni</p>
          <h1 className="mt-2 font-serif text-[2.3rem] leading-[1.06] tracking-tight sm:text-[2.9rem]">
            What&rsquo;s worth trading right now.
          </h1>
          <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">
            One call, from every perpetual on{" "}
            <a
              href={OMNI_URL}
              className="text-ink underline decoration-rule-2 underline-offset-2 hover:text-rust"
            >
              Variational Omni
            </a>
            , picked on real trading volume and filtered by a single test: does it typically move
            enough, in the time you plan to hold it, to cover its own spread? Omni charges no
            trading fees, so that spread is the whole cost.{" "}
            <Link href="/method" className="underline decoration-rule-2 underline-offset-2 hover:text-rust">
              How it works
            </Link>{" "}
            ·{" "}
            <Link href="/markets" className="underline decoration-rule-2 underline-offset-2 hover:text-rust">
              All markets
            </Link>
          </p>
        </header>

        <Screener />
      </div>
    </>
  );
}
