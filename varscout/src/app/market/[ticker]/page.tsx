import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchSnapshotCached } from "@/lib/variational/api";
import { costAt, isPinned, tierCurve } from "@/lib/variational/scoring";
import { bps, money, pct, price } from "@/lib/format";
import { OMNI_URL, SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 300;
export const dynamicParams = true;

/** Pre-render the liquid markets; everything else renders on demand. */
export async function generateStaticParams() {
  try {
    const { markets } = await fetchSnapshotCached();
    return markets
      .filter((m) => m.vol24 >= 1_000_000)
      .map((m) => ({ ticker: m.ticker }));
  } catch {
    return [];
  }
}

async function getMarket(ticker: string) {
  try {
    const { markets } = await fetchSnapshotCached();
    return markets.find((m) => m.ticker.toLowerCase() === ticker.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  const m = await getMarket(ticker);
  if (!m) return { title: "Market not found", robots: { index: false, follow: true } };

  const title = `${m.ticker} — ${m.name} funding and depth`;
  const description = `${m.name} (${m.ticker}) on Variational Omni: funding ${pct(m.funding)} annualized, base spread ${bps(m.spreadBps)}, 24h volume ${money(m.vol24)}. Full tiered depth curve and what a carry position would cost at each size.`;
  const url = `${SITE_URL}/market/${m.ticker}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${m.ticker} tearsheet on ${SITE_NAME}` }],
    },
  };
}

export default async function MarketPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const m = await getMarket(ticker);
  if (!m) notFound();

  const curve = tierCurve(m.quotes);
  const oi = m.oiLong + m.oiShort;
  const skew = oi > 0 ? (m.oiLong - m.oiShort) / oi : 0;
  const pinned = isPinned(m.funding);
  const direction = m.funding > 0 ? "SHORT" : "LONG";
  const sizes = [1_000, 5_000, 25_000, 100_000, 250_000, 1_000_000];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${m.ticker} — ${m.name}`,
    url: `${SITE_URL}/market/${m.ticker}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Screener", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Markets", item: `${SITE_URL}/markets` },
        { "@type": "ListItem", position: 3, name: m.ticker, item: `${SITE_URL}/market/${m.ticker}` },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-[0.78rem] text-muted">
          <Link href="/" className="no-underline hover:text-rust">
            Screener
          </Link>
          <span className="mx-2">/</span>
          <Link href="/markets" className="no-underline hover:text-rust">
            Markets
          </Link>
          <span className="mx-2">/</span>
          <span>{m.ticker}</span>
        </nav>

        <header className="mb-9">
          <p className="eyebrow">Tearsheet</p>
          <h1 className="mt-3 font-serif text-[2.4rem] leading-tight tracking-tight sm:text-[3rem]">
            {m.name} <span className="text-muted">({m.ticker})</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-ink-2">
            {pinned ? (
              <>
                Funding on {m.ticker} sits at the platform default of {pct(m.funding)}, which is the
                standard 0.01% per 8 hours annualized. That is not a market signal, so {m.ticker} is
                excluded from the screener until its funding moves off the default.
              </>
            ) : (
              <>
                Funding runs {pct(m.funding)} annualized, paid by {m.funding > 0 ? "longs to shorts" : "shorts to longs"}
                , so a {direction.toLowerCase()} position collects it. Whether that is worth taking
                depends entirely on the spread at your size — the curve below shows what each clip
                actually costs.
              </>
            )}
          </p>
        </header>

        <section className="sheet mb-8 grid grid-cols-2 gap-x-8 gap-y-6 px-6 py-7 sm:grid-cols-4">
          <Stat label="Mark price" value={price(m.mark)} />
          <Stat
            label="Funding (annualized)"
            value={pct(m.funding)}
            note={`every ${(m.intervalS / 3600).toFixed(0)}h`}
            accent={pinned ? "text-muted" : m.funding > 0 ? "text-rust" : "text-forest"}
          />
          <Stat label="24h volume" value={money(m.vol24)} />
          <Stat label="Open interest" value={money(oi)} note={`skew ${skew >= 0 ? "+" : ""}${skew.toFixed(2)}`} />
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-baseline justify-between border-b border-rust pb-2">
            <h2 className="font-serif text-[1.5rem] leading-none">Depth curve</h2>
            <p className="text-[0.75rem] text-muted">published tiers</p>
          </div>
          <p className="mb-5 max-w-2xl text-[0.9rem] leading-relaxed text-ink-2">
            Omni quotes a different spread at each size. This is the single most important table on
            the page: carry stays flat as your position grows, but cost does not, so a market can be
            the best trade on the board small and not qualify at all large.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-[0.86rem]">
              <thead>
                <tr className="border-b border-rule-2">
                  {["Tier", "Bid", "Ask", "Round trip", "Payback"].map((h, i) => (
                    <th key={h} scope="col" className={`eyebrow px-2 pb-2 ${i === 0 ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {curve.map((p) => {
                  const q = m.quotes[p.name as keyof typeof m.quotes] as { bid: string; ask: string };
                  const daily = Math.abs(m.funding) / 365;
                  const payback = daily > 0 ? p.bps / 1e4 / daily : Infinity;
                  return (
                    <tr key={p.name} className="border-b border-rule">
                      <td className="px-2 py-2.5 text-ink">{p.name.replace("size_", "")}</td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">{price(parseFloat(q.bid))}</td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">{price(parseFloat(q.ask))}</td>
                      <td className="tnum px-2 py-2.5 text-right font-medium text-ink">{bps(p.bps)}</td>
                      <td className="tnum px-2 py-2.5 text-right text-muted">
                        {pinned || !Number.isFinite(payback)
                          ? "—"
                          : payback * 24 < 48
                            ? `${(payback * 24).toFixed(1)}h`
                            : `${payback.toFixed(1)}d`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!curve.some((p) => p.name === "size_1m") && (
            <p className="mt-3 text-[0.8rem] text-muted">
              No $1m tier is published for {m.ticker}, which is itself a capacity signal: the venue
              is not quoting a clip that large here.
            </p>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between border-b border-rust pb-2">
            <h2 className="font-serif text-[1.5rem] leading-none">Cost by position size</h2>
            <p className="text-[0.75rem] text-muted">interpolated between tiers</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-[0.86rem]">
              <thead>
                <tr className="border-b border-rule-2">
                  {["Size", "Round trip", "Cost", "Carry / day", "Payback"].map((h, i) => (
                    <th key={h} scope="col" className={`eyebrow px-2 pb-2 ${i === 0 ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((n) => {
                  const c = costAt(m.quotes, n);
                  if (!c) return null;
                  const daily = Math.abs(m.funding) / 365;
                  const payback = daily > 0 ? c.costBps / 1e4 / daily : Infinity;
                  return (
                    <tr key={n} className="border-b border-rule">
                      <td className="tnum px-2 py-2.5 text-ink">
                        {money(n)}
                        {!c.covered && <span className="ml-2 text-[0.7rem] text-amber">beyond quote</span>}
                      </td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">{bps(c.costBps)}</td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">
                        {money((c.costBps / 1e4) * n)}
                      </td>
                      <td className="tnum px-2 py-2.5 text-right text-ink-2">
                        {pinned ? "—" : money(daily * n)}
                      </td>
                      <td className="tnum px-2 py-2.5 text-right font-medium text-ink">
                        {pinned || !Number.isFinite(payback)
                          ? "—"
                          : payback * 24 < 48
                            ? `${(payback * 24).toFixed(1)}h`
                            : `${payback.toFixed(1)}d`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-6 text-[0.85rem]">
          <Link href="/" className="border-b border-rust pb-0.5 text-rust no-underline hover:border-ink hover:text-ink">
            Back to the screener →
          </Link>
          <Link href="/markets" className="text-ink-2 no-underline hover:text-rust">
            All markets
          </Link>
          <a href={OMNI_URL} className="ml-auto text-muted no-underline hover:text-rust">
            Trade on Omni ↗
          </a>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  note,
  accent = "text-ink",
}: {
  label: string;
  value: string;
  note?: string;
  accent?: string;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`tnum mt-1.5 font-serif text-[1.45rem] leading-none ${accent}`}>{value}</p>
      {note && <p className="tnum mt-1.5 text-[0.74rem] text-muted">{note}</p>}
    </div>
  );
}
