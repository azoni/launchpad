import Link from "next/link";
import { Live } from "./Live";
import { bps, money, pct } from "@/lib/format";
import type { Pulsed, PulseConfig } from "@/lib/variational/pulse";

const WHY: Record<string, string> = {
  "new longs": "buyers opening new positions",
  "new shorts": "sellers opening new positions",
  "shorts covering": "shorts buying back — squeeze, not fresh demand",
  "longs closing": "longs stepping out",
  quiet: "open interest broadly flat",
};

/**
 * The whole page in one glance: what to do, and the three numbers that decide
 * whether it is worth doing. Everything else is a disclosure below this.
 */
export function CallCard({
  r,
  cfg,
  alternatives,
}: {
  r: Pulsed;
  cfg: PulseConfig;
  alternatives: Pulsed[];
}) {
  const hold = cfg.holdHours < 1 ? `${cfg.holdHours * 60}m` : `${cfg.holdHours}h`;

  return (
    <section className="sheet px-6 py-7 sm:px-9 sm:py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
        <p className="eyebrow">The call</p>
        <p className="tnum text-[0.72rem] text-muted">
          {hold} hold · {money(cfg.notional)} · {bps(r.costBps)} round trip
        </p>
      </div>

      {/* Direction + market */}
      <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
        {r.bias ? (
          <span
            className={`font-serif text-[3rem] leading-none tracking-tight sm:text-[3.8rem] ${
              r.bias === "SHORT" ? "text-rust" : "text-forest"
            }`}
          >
            {r.bias}
          </span>
        ) : (
          <span className="font-serif text-[2.2rem] leading-none tracking-tight text-muted sm:text-[2.6rem]">
            No clear side
          </span>
        )}
        <Link
          href={`/market/${r.ticker}`}
          className="font-serif text-[3rem] leading-none tracking-tight text-ink no-underline hover:text-rust sm:text-[3.8rem]"
        >
          {r.ticker}
        </Link>
        {r.refPct24 !== null && (
          <span
            className={`tnum text-[1.4rem] leading-none ${
              r.refPct24 >= 0 ? "text-forest" : "text-rust"
            }`}
          >
            <Live value={`${pct(r.refPct24, 1)} today`} />
          </span>
        )}
      </div>
      <p className="mt-2 text-[0.95rem] text-muted">{r.name}</p>

      {/* The three numbers that decide it */}
      <div className="mt-7 grid grid-cols-3 gap-px border border-rule bg-rule">
        <Figure
          value={pct(r.breakevenPct, 2, false)}
          label="needed to break even"
          sub="you lose below this"
        />
        <Figure
          value={pct(r.typicalMovePct, 2, false)}
          label={`typical move in ${hold}`}
          sub="how far it usually gets"
        />
        <Figure
          value={r.viability !== null ? `${r.viability.toFixed(1)}x` : "—"}
          label="edge over the spread"
          sub={(r.viability ?? 0) >= 3 ? "comfortable" : "thin — size down"}
          accent={(r.viability ?? 0) >= 3 ? "text-forest" : "text-amber"}
        />
      </div>

      {/* One line of why */}
      <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-2">
        {r.volMult !== null && r.volMult >= 1.5 ? (
          <>
            Trading <strong className="font-semibold text-ink">{r.volMult.toFixed(1)}x</strong> its
            normal volume
          </>
        ) : (
          <>
            {r.refVol24 !== null ? (
              <>
                <strong className="font-semibold text-ink">{money(r.refVol24)}</strong> traded today
              </>
            ) : (
              <>Active on Omni</>
            )}
          </>
        )}
        , {WHY[r.flow]}
        {r.bias && <>. Momentum favours the {r.bias.toLowerCase()} side</>}.
      </p>

      {r.bias && (
        <p className="mt-2 text-[0.78rem] text-muted">
          Direction is momentum continuation, not a forecast — a busy market says something is
          happening, not how it ends.
        </p>
      )}

      {alternatives.length > 0 && (
        <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-rule pt-4">
          <span className="eyebrow">Or</span>
          {alternatives.map((a) => (
            <Link
              key={a.ticker}
              href={`/market/${a.ticker}`}
              className="tnum text-[0.85rem] no-underline"
            >
              <span
                className={`font-semibold ${a.bias === "SHORT" ? "text-rust" : a.bias === "LONG" ? "text-forest" : "text-muted"}`}
              >
                {a.bias ?? "—"}
              </span>{" "}
              <span className="text-ink hover:text-rust">{a.ticker}</span>{" "}
              <span className="text-muted">
                {a.refPct24 !== null ? pct(a.refPct24, 1) : ""}
                {a.viability !== null ? ` · ${a.viability.toFixed(1)}x` : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Figure({
  value,
  label,
  sub,
  accent = "text-ink",
}: {
  value: string;
  label: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="bg-paper px-4 py-5 text-center">
      <p className={`tnum font-serif text-[1.9rem] leading-none sm:text-[2.2rem] ${accent}`}>
        <Live value={value} />
      </p>
      <p className="mt-2 text-[0.76rem] leading-tight text-ink-2">{label}</p>
      <p className="mt-1 text-[0.7rem] leading-tight text-muted">{sub}</p>
    </div>
  );
}
