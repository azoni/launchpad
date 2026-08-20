import Link from "next/link";
import type { Metadata } from "next";
import { fetchSnapshotCached } from "@/lib/variational/api";
import { isPinned } from "@/lib/variational/scoring";
import type { Market } from "@/lib/variational/types";
import { bps, money, pct, price } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300;

const TITLE = "Every tracked market";
const DESCRIPTION =
  "All perpetual markets listed on Variational Omni, with live mark price, funding rate, open-interest skew and base spread. Markets at a default funding rate are marked as carrying no signal.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/markets` },
  openGraph: {
    title: `${TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/markets`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} market directory` }],
  },
};

export default async function MarketsPage() {
  let markets: Market[] = [];
  try {
    markets = (await fetchSnapshotCached()).markets;
  } catch {
    // The directory degrades to an explanatory empty state rather than a 500.
  }
  const sorted = [...markets].sort((a, b) => b.vol24 - a.vol24);
  const live = sorted.filter((m) => !isPinned(m.funding));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/markets`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Screener", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: TITLE, item: `${SITE_URL}/markets` },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: sorted.length,
      itemListElement: sorted.slice(0, 50).map((m, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${m.name} (${m.ticker})`,
        url: `${SITE_URL}/market/${m.ticker}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-[0.78rem] text-muted">
          <Link href="/" className="no-underline hover:text-rust">
            Screener
          </Link>
          <span className="mx-2">/</span>
          <span>Markets</span>
        </nav>

        <header className="mb-9 max-w-3xl">
          <p className="eyebrow">Directory</p>
          <h1 className="mt-3 font-serif text-[2.3rem] leading-tight tracking-tight sm:text-[2.9rem]">
            {TITLE}
          </h1>
          <p className="mt-4 text-[1rem] leading-relaxed text-ink-2">
            Every perpetual listed on Variational Omni, ordered by 24-hour volume. Of{" "}
            {sorted.length} markets, {live.length} carry a funding rate that means something — the
            rest sit at a platform default and are excluded from the{" "}
            <Link href="/" className="text-ink underline decoration-rule-2 underline-offset-2 hover:text-rust">
              screener
            </Link>
            . The spread shown is the base-tier quote; it widens substantially with size, which is
            what the{" "}
            <Link href="/method" className="text-ink underline decoration-rule-2 underline-offset-2 hover:text-rust">
              method
            </Link>{" "}
            page explains.
          </p>
        </header>

        {sorted.length === 0 ? (
          <p className="text-ink-2">The Variational endpoint did not respond. Try again shortly.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-[0.86rem]">
              <caption className="sr-only">
                All Variational Omni perpetual markets with live pricing and funding
              </caption>
              <thead>
                <tr className="border-b border-rule-2">
                  {["Market", "Mark", "Funding", "Spread", "OI skew", "24h volume"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`eyebrow px-2 pb-2 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => {
                  const oi = m.oiLong + m.oiShort;
                  const skew = oi > 0 ? (m.oiLong - m.oiShort) / oi : 0;
                  const pinned = isPinned(m.funding);
                  return (
                    <tr key={m.ticker} className="row-lift border-b border-rule">
                      <td className="px-2 py-2.5">
                        <Link href={`/market/${m.ticker}`} className="no-underline">
                          <span className="font-medium text-ink hover:text-rust">{m.ticker}</span>
                          <span className="ml-2 text-[0.78rem] text-muted">{m.name}</span>
                        </Link>
                      </td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">{price(m.mark)}</td>
                      <td
                        className={`tnum px-2 py-2.5 text-right ${
                          pinned ? "text-muted" : m.funding > 0 ? "text-rust" : "text-forest"
                        }`}
                      >
                        {pct(m.funding)}
                        {pinned && <span className="ml-1.5 text-[0.68rem]">default</span>}
                      </td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">{bps(m.spreadBps)}</td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">
                        {skew >= 0 ? "+" : ""}
                        {skew.toFixed(2)}
                      </td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">{money(m.vol24)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
