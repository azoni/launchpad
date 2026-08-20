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
            text: "Funding carry net of the round-trip spread you would actually pay at your chosen position size, using Variational Omni's own tiered depth quotes. Cost is amortized over the intended holding period, and markets whose spread cannot be earned back within three days are excluded.",
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
        <header className="mb-10 max-w-3xl">
          <p className="eyebrow">Variational Omni · funding carry</p>
          <h1 className="mt-3 font-serif text-[2.5rem] leading-[1.06] tracking-tight sm:text-[3.25rem]">
            One position, chosen from 540 markets.
          </h1>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-2">
            Varscout reads the public market-statistics endpoint published by{" "}
            <a
              href={OMNI_URL}
              className="text-ink underline decoration-rule-2 underline-offset-2 hover:text-rust"
            >
              Variational Omni
            </a>{" "}
            and ranks every perpetual by funding carry net of what the spread actually costs at your
            size. Omni charges no trading fees, so the spread is the entire cost of a position — and
            because the venue publishes tiered depth quotes, that cost can be computed before you
            trade rather than discovered after. Most of the book is filtered out: roughly four in
            five markets sit at a default funding rate that carries no information.
          </p>
          <p className="mt-4 text-[0.92rem] leading-relaxed text-muted">
            Read the{" "}
            <Link href="/method" className="text-ink-2 underline decoration-rule-2 underline-offset-2 hover:text-rust">
              method
            </Link>{" "}
            for how each number is derived and what it cannot tell you, or browse{" "}
            <Link href="/markets" className="text-ink-2 underline decoration-rule-2 underline-offset-2 hover:text-rust">
              every tracked market
            </Link>
            .
          </p>
        </header>

        <Screener />
      </div>
    </>
  );
}
