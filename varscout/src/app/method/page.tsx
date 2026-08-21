import Link from "next/link";
import type { Metadata } from "next";
import { OMNI_DOCS_URL, OMNI_URL, SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Method";
const DESCRIPTION =
  "How Varscout scores Variational Omni markets: funding carry net of the tiered spread at your size, amortized over the holding period, weighted by how persistent the funding has been — and the four things this data cannot tell you.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/method` },
  openGraph: {
    title: `${TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/method`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} methodology` }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Varscout scores a Variational Omni market",
  description: DESCRIPTION,
  url: `${SITE_URL}/method`,
  step: [
    { "@type": "HowToStep", name: "Filter defaults", text: "Discard markets sitting at a default funding rate — 0.1095 annualized (0.01% per 8 hours) or zero. Roughly four in five markets are at a default and carry no information." },
    { "@type": "HowToStep", name: "Filter liquidity", text: "Require at least $1m of 24-hour volume and $250k of open interest." },
    { "@type": "HowToStep", name: "Set direction", text: "Positive funding means longs pay shorts, so a short collects. Negative funding means the reverse." },
    { "@type": "HowToStep", name: "Price the spread at size", text: "Interpolate the venue's published tiered depth quotes in log-size to get the round-trip cost for the chosen position size." },
    { "@type": "HowToStep", name: "Test payback", text: "Reject any market whose spread the carry cannot earn back within three days." },
    { "@type": "HowToStep", name: "Net and rank", text: "Amortize the round-trip cost over the intended holding period, subtract it from the carry, and weight by how much history backs the funding rate and how stable its sign has been." },
  ],
};

export default function MethodPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-6 text-[0.78rem] text-muted">
          <Link href="/" className="no-underline hover:text-rust">
            Screener
          </Link>
          <span className="mx-2">/</span>
          <span>Method</span>
        </nav>

        <header className="mb-10">
          <p className="eyebrow">Methodology</p>
          <h1 className="mt-3 font-serif text-[2.4rem] leading-tight tracking-tight sm:text-[3rem]">
            How a position gets picked
          </h1>
          <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-2">
            Varscout answers one question: of the perpetual markets on{" "}
            <a href={OMNI_URL} className="text-ink underline decoration-rule-2 underline-offset-2 hover:text-rust">
              Variational Omni
            </a>
            , which one pays the most to hold right now, after the cost of getting in and out at the
            size you actually trade? Everything below is the arithmetic behind that, followed by an
            honest account of what this data cannot tell you.
          </p>
        </header>

        <Section n="00" title="Two modes, because two horizons need different maths">
          <p>
            The default view, <strong>Now</strong>, is for trades measured in hours. The second,{" "}
            <strong>Carry</strong>, is for positions held for days. They are not presentation
            variants of one ranking — the arithmetic that decides a good trade genuinely inverts
            between them.
          </p>
          <p>
            The reason is that funding accrues per second while the spread is paid once. Hold a 50%
            annualized carry for one hour and you earn about {" "}
            <Term>0.006%</Term>. A typical round trip costs 5 to 50 times that. So on a short
            horizon <em>carry is worth essentially nothing</em> and cannot justify a position;
            the move has to. Over a week the ratio reverses and carry dominates.
          </p>
          <p>
            Now mode therefore ranks by where activity is, and uses cost as a gate rather than a
            subtraction. Carry mode ranks by yield net of amortized cost. Sections 01 to 05 describe
            Carry mode; section 06 describes Now.
          </p>
        </Section>

        <Section n="01" title="Funding is annualized, and most of it is noise">
          <p>
            The endpoint publishes a <Term>funding_rate</Term> per market. It is an annualized rate
            expressed as a decimal, not a per-interval one. The giveaway is the value{" "}
            <Term>0.1095</Term>, which appears on hundreds of markets at once and is exactly 0.01% ×
            3 × 365 — the standard 0.01%-per-8-hours baseline, annualized.
          </p>
          <p>
            Together with the markets sitting at exactly zero, roughly four in five are parked at a
            default. Those are excluded outright. They are not a signal that funding is mild; they
            are a signal that nothing is being priced. That leaves around a hundred markets with
            real funding, of which about fifty clear the volume floor on a given day.
          </p>
        </Section>

        <Section n="02" title="Direction follows who pays whom">
          <p>
            Positive funding means longs pay shorts, so a <strong>short</strong> collects it.
            Negative funding means shorts pay longs, so a <strong>long</strong> collects. There is
            no cleverness here — the sign of the rate determines the side, and the magnitude
            determines whether it is worth the risk of holding it.
          </p>
        </Section>

        <Section n="03" title="The spread is the entire cost, and it grows with size">
          <p>
            Omni charges no trading fees, which makes the bid-ask spread the whole cost of a
            position. The venue publishes tiered quotes — a price for a minimum clip, for $1,000,
            for $100,000, and for $1m on its ten deepest markets. That is unusually generous data:
            it means execution cost can be computed <em>before</em> trading rather than discovered
            after.
          </p>
          <p>
            It also means headline carries are frequently size-illusions. In a thin market the
            round-trip spread can widen roughly tenfold between the base tier and $100,000 while the
            carry stays exactly where it was. A market that is the best trade on the board at
            $5,000 can fail to qualify at all at $100,000. This is the single most consequential
            thing on the site, which is why position size is a control on the screener rather than a
            setting buried somewhere.
          </p>
          <p>
            Because the tiers are sparse, a clip landing between two of them is priced by
            interpolating the depth curve in log-size, rather than being charged the full cost of
            the next tier up. Where a position exceeds the deepest published quote, the row is
            flagged <Term>size&gt;quote</Term> — the true cost there is unknown and worse than shown.
          </p>
        </Section>

        <Section n="04" title="Payback, then netting">
          <p>
            The round trip is a one-off cost against a carry that accrues continuously, so the first
            test is how long the carry takes to earn the spread back. Anything over three days is
            rejected. What survives is netted: the round-trip cost is amortized across the intended
            holding period and subtracted from the annualized carry.
          </p>
          <p>
            A separate figure, <Term>mark edge</Term>, records the immediate mark-to-market on
            entry. You transact at bid or ask, but profit, loss and liquidation price are all
            computed against the mark, so any gap between them is real money at the moment you open.
          </p>
        </Section>

        <Section n="05" title="Confidence comes from collected history, not the endpoint">
          <p>
            The upstream endpoint is a snapshot. It publishes no history at all — no candles, no
            trade prints, no past funding. So Varscout keeps its own: a collector polls every five
            minutes and folds each reading into running per-market statistics.
          </p>
          <p>
            From those it derives two things the snapshot cannot give you. <strong>Sign stability</strong>{" "}
            is how often funding has held the sign it has right now; a rate that keeps flipping
            cannot be harvested however large it looks today. <strong>Realized volatility</strong> is
            annualized from log returns, scaled by each interval&rsquo;s own elapsed time so an
            irregular polling cadence does not distort it. Once a market has enough readings, the
            historical mean funding replaces the spot rate in scoring, because one snapshot of a
            funding rate is a single draw and it is the average that actually pays.
          </p>
          <p>
            Rows without enough history are marked <Term>PROVISIONAL</Term>. Treat them as a
            screener, not a signal.
          </p>
        </Section>

        <Section n="06" title="Now mode: real volume, spikes, and whether a move can clear the spread">
          <p>
            <strong>Omni&rsquo;s volume figure is the wrong instrument for this.</strong>{" "}
            <Term>volume_24h</Term> measures what trades <em>on Omni</em>, which runs 10 to 100 times
            below a token&rsquo;s real turnover. ONG showed $0.6m on Omni while doing $24m elsewhere
            and finishing the day up 124%. Screening on Omni&rsquo;s own volume hid that completely —
            it filtered out 495 of 543 markets, including nearly every genuine mover.
          </p>
          <p>
            So volume and 24-hour movement come from Binance instead, covering 296 of Omni&rsquo;s
            543 listings and about 64% of its open interest. Omni&rsquo;s figures still decide the
            things only they can: the spread you pay, the depth available at your size, funding, and
            open interest. The two are shown side by side — <em>real 24h</em> against{" "}
            <em>on Omni</em> — because they answer different questions. One tells you whether
            anything is happening; the other tells you whether you can get filled.
          </p>
          <p>
            Spikes are <strong>measured, not inferred</strong>, for the most active markets: the
            latest real five-minute volume bar against the median of the previous twelve. Elsewhere
            the older estimator still applies — <Term>volume_24h</Term> is a rolling window, so its
            change per second approximates the current trading rate, compared against a baseline the
            collector accumulates over days. Those rows are marked <Term>est</Term>. A negative
            reading there means an old burst aged out of the window rather than trading stopping, so
            it is floored at zero.
          </p>
          <p>
            Price movement is reported in standard deviations rather than percent, because 1% means
            something different in gold than in a memecoin. The sigma is taken from the collector&rsquo;s
            multi-day volatility, not from the last few minutes: volatility measured over a short
            window is badly unstable, and a price that trends smoothly has almost no variance in its
            increments — it would report a market as dead precisely while it is moving most.
          </p>
          <p>
            Open-interest change separates new positioning from position closing, which is the
            difference between a move with fuel behind it and one that is unwinding. Price up on
            rising OI is longs opening; price up on falling OI is shorts buying back.
          </p>
          <p>
            The gate is <strong>edge versus spread</strong>: the one-sigma move over your holding
            window divided by the move needed just to cover the round trip. Below 1, a normal move
            does not pay for the trade and the market is excluded no matter how much volume it
            prints. This is the single number worth looking at before taking anything here.
          </p>
          <p>
            Two limits worth knowing. Binance covers a little over half of Omni&rsquo;s book —
            equities, commodities, forex and the newest listings have no reference at all, and fall
            back to Omni&rsquo;s own figures with a warning flag. And a market can be genuinely
            active globally while almost nothing trades on Omni; those rows are marked{" "}
            <Term>thin on Omni</Term>, and the depth curve on the market page is the honest test of
            whether size is actually available.
          </p>
        </Section>

        <Section n="07" title="What this cannot tell you">
          <p>
            <strong>It is not an arbitrage.</strong> Collecting funding on a perpetual is an
            unhedged directional position, and Omni offers no way to hedge it internally. A 55%
            carry on a token with 90% annualized volatility is a volatility bet with a coupon
            attached. That is why carry-to-volatility is reported alongside carry, and why you can
            rank by it.
          </p>
          <p>
            <strong>Nothing here is backtested.</strong> Because the endpoint has no history, the
            central assumption — that a funding rate visible now persists long enough to earn back
            the spread — cannot be tested until enough has been collected. The collector is building
            that record; until it has, the honest status of every claim on this site is
            provisional.
          </p>
          <p>
            <strong>There is no order flow to read.</strong> Omni is request-for-quote with a single
            liquidity provider as the only eligible maker. There is no order book, so no resting
            liquidity to observe and nothing to anticipate. Limit orders exist, but as private
            conditional triggers against the provider&rsquo;s quote, not as public depth.
          </p>
          <p>
            <strong>A spike is not a direction.</strong> Elevated volume says something is
            happening; it does not say how it resolves. The direction shown in Now mode is momentum
            continuation, which is a description of what just occurred, not a forecast. You are also
            quoting against the same market maker who sees that flow and widens when it gets noisy —
            so the spread you are measured against can move against you exactly when the signal
            fires.
          </p>
          <p>
            <strong>&ldquo;Live&rdquo; means about a minute.</strong> The upstream snapshot advances
            in discrete steps of roughly 70 seconds: six polls eight seconds apart return
            byte-identical data, then several hundred quotes move at once. This page polls every 20
            seconds so it catches each step promptly, and it counts a tick only when the venue&rsquo;s
            own timestamp advances — counting repeat polls would divide real volume by imaginary
            elapsed time. Sub-minute resolution is not available from this source at any polling rate.
          </p>
          <p>
            <strong>Execution is manual.</strong> Variational&rsquo;s trading API is not available
            yet — only the read-only statistics endpoint this site consumes. Varscout identifies a
            position; you place it yourself in the Omni interface, where the quoted price on accept
            may differ from what was shown here.
          </p>
        </Section>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-6 text-[0.85rem]">
          <Link href="/" className="border-b border-rust pb-0.5 text-rust no-underline hover:border-ink hover:text-ink">
            See today&rsquo;s position →
          </Link>
          <Link href="/markets" className="text-ink-2 no-underline hover:text-rust">
            Browse all markets
          </Link>
          <a href={OMNI_DOCS_URL} className="ml-auto text-muted no-underline hover:text-rust">
            Variational docs ↗
          </a>
        </div>
      </div>
    </>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-11">
      <div className="mb-4 flex items-baseline gap-4 border-b border-rust pb-2">
        <span className="tnum font-serif text-[0.95rem] text-rust">{n}</span>
        <h2 className="font-serif text-[1.5rem] leading-none">{title}</h2>
      </div>
      <div className="space-y-4 text-[0.98rem] leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

function Term({ children }: { children: React.ReactNode }) {
  return (
    <code className="border border-rule bg-paper-2 px-1 py-0.5 text-[0.86em] text-ink">{children}</code>
  );
}
