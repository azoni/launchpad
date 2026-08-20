import Link from "next/link";
import { Sparkline } from "@/components/Sparkline";
import { bps, duration, money, pct, price, span, usd } from "@/lib/format";
import type { Scored, ScoringConfig } from "@/lib/variational/types";

/**
 * The lead item on the sheet: one position, stated plainly, with every number
 * that decides whether to take it — and the ones that argue against.
 */
export function BestTrade({ r, cfg }: { r: Scored; cfg: ScoringConfig }) {
  const isShort = r.direction === "SHORT";
  const tone = isShort ? "text-rust" : "text-forest";
  const verb = isShort ? "Sell" : "Buy";

  return (
    <section className="sheet px-6 py-7 sm:px-9 sm:py-9">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="eyebrow">Today&rsquo;s position</p>
        <p className="text-[0.72rem] text-muted">
          Ranked 1 of {cfg.riskAdjusted ? "carry per unit of risk" : "net annualized carry"}
        </p>
      </div>

      <h2 className="mt-3 font-serif text-[2.6rem] leading-[1.08] tracking-tight sm:text-[3.4rem]">
        <span className={tone}>{isShort ? "Short" : "Long"}</span>{" "}
        <Link href={`/market/${r.ticker}`} className="text-ink no-underline hover:text-rust">
          {r.name}
        </Link>{" "}
        <span className="text-muted">({r.ticker})</span>
      </h2>

      <p className="mt-4 max-w-2xl text-[1.02rem] leading-relaxed text-ink-2">
        Funding runs {pct(r.carryApr)} annualized against {isShort ? "longs" : "shorts"}, so a{" "}
        {r.direction.toLowerCase()} collects it. Crossing the spread at {money(cfg.notional)} costs{" "}
        {bps(r.costBps)} round trip, which the carry earns back in {duration(r.paybackDays)}. Held{" "}
        {cfg.holdDays} days that nets{" "}
        <strong className="font-semibold text-ink">{pct(r.netApr)} annualized</strong>, or about{" "}
        {usd(r.netUsd)}.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-rule pt-7 sm:grid-cols-4">
        <Stat label="Net annualized" value={pct(r.netApr)} accent={tone} big />
        <Stat label="Gross carry" value={pct(r.carryApr)} note={`${pct(r.carryDaily, 3)}/day`} />
        <Stat
          label="Round-trip cost"
          value={bps(r.costBps)}
          note={`${usd(r.costUsd)} · tier ${r.tier.replace(/size_/g, "").replace("~", "→")}`}
        />
        <Stat label="Spread payback" value={duration(r.paybackDays)} note="carry earns the cost back" />
      </dl>

      <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-rule pt-7 sm:grid-cols-4">
        <Stat
          label="Entry"
          value={`${verb} ${price(r.sizeUnits)}`}
          note={`@ ${price(r.entryPx)} · ${money(cfg.notional)}`}
        />
        <Stat
          label="Mark edge"
          value={bps(r.markEdgeBps)}
          note={r.markEdgeBps >= 0 ? "favorable at entry" : "adverse at entry"}
          accent={r.markEdgeBps >= 0 ? "text-forest" : "text-rust"}
        />
        <Stat
          label="Realized vol"
          value={r.vol === null ? "—" : pct(r.vol, 0, false)}
          note={r.carryVol === null ? "needs more history" : `carry/vol ${r.carryVol.toFixed(2)}`}
        />
        <Stat
          label="Positioning"
          value={`${r.skew >= 0 ? "+" : ""}${r.skew.toFixed(2)}`}
          note={`OI ${money(r.oi)} · ${r.skew >= 0 ? "net long" : "net short"}`}
        />
      </dl>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule pt-6">
        <Confidence r={r} />
        {r.history.fundingSeries && r.history.fundingSeries.length > 2 && (
          <div className="flex items-center gap-3">
            <span className="eyebrow">Funding</span>
            <Sparkline values={r.history.fundingSeries} zeroLine width={140} />
          </div>
        )}
        <Link
          href={`/market/${r.ticker}`}
          className="ml-auto border-b border-rust pb-0.5 text-[0.85rem] text-rust no-underline hover:border-ink hover:text-ink"
        >
          Full tearsheet for {r.ticker} →
        </Link>
      </div>

      {r.flags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {r.flags.map((f) => (
            <li
              key={f}
              className="border border-amber/40 bg-amber-soft px-2 py-0.5 text-[0.72rem] text-amber"
            >
              {f}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Confidence({ r }: { r: Scored }) {
  const h = r.history;
  return (
    <div className="flex items-baseline gap-3">
      <span
        className={`px-2 py-0.5 text-[0.72rem] font-semibold tracking-wide ${
          r.provisional ? "bg-amber-soft text-amber" : "bg-forest-soft text-forest"
        }`}
      >
        {r.provisional ? "PROVISIONAL" : "CONFIRMED"}
      </span>
      <span className="text-[0.78rem] text-muted">
        {h.n > 0 ? (
          <>
            {h.n} readings over {span(h.spanS)}
            {h.signStability !== null && <> · sign held {pct(h.signStability, 0, false)}</>}
          </>
        ) : (
          "no collected history yet — scored from a single snapshot"
        )}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  accent = "text-ink",
  big = false,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: string;
  big?: boolean;
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd
        className={`tnum mt-1.5 font-serif leading-none ${accent} ${big ? "text-[2rem]" : "text-[1.45rem]"}`}
      >
        {value}
      </dd>
      {note && <p className="tnum mt-1.5 text-[0.74rem] leading-snug text-muted">{note}</p>}
    </div>
  );
}
