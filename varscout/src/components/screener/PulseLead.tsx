import Link from "next/link";
import { Live } from "./Live";
import { Sparkline } from "@/components/Sparkline";
import { bps, money, pct, price, usd } from "@/lib/format";
import type { Pulsed, Tick } from "@/lib/variational/pulse";
import type { PulseConfig } from "@/lib/variational/pulse";

const FLOW_COPY: Record<string, string> = {
  "new longs": "price up on rising open interest — longs opening",
  "new shorts": "price down on rising open interest — shorts opening",
  "shorts covering": "price up on falling open interest — shorts buying back",
  "longs closing": "price down on falling open interest — longs exiting",
  quiet: "open interest broadly flat",
};

export function PulseLead({
  r,
  cfg,
  windowMinutes,
  ticks,
}: {
  r: Pulsed;
  cfg: PulseConfig;
  windowMinutes: number;
  ticks: Tick[];
}) {
  const up = (r.movePct ?? 0) >= 0;
  const tone = r.bias === "SHORT" ? "text-rust" : r.bias === "LONG" ? "text-forest" : "text-ink";
  const marks = ticks.map((t) => t.mark);

  return (
    <section className="sheet px-6 py-7 sm:px-9 sm:py-9">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="eyebrow">Most active right now</p>
        <p className="text-[0.72rem] text-muted">
          measured over the last {Math.round((r.windowS ?? 0) / 60)}m · {r.samples} ticks
        </p>
      </div>

      <h2 className="mt-3 flex flex-wrap items-baseline gap-x-4 font-serif text-[2.4rem] leading-[1.08] tracking-tight sm:text-[3.1rem]">
        <Link href={`/market/${r.ticker}`} className="text-ink no-underline hover:text-rust">
          {r.ticker}
        </Link>
        <span className={`tnum text-[1.9rem] sm:text-[2.3rem] ${up ? "text-forest" : "text-rust"}`}>
          <Live value={pct(r.movePct, 2)} />
        </span>
        {r.volMult !== null && r.volMult >= 2 && (
          <span className="tnum bg-amber-soft px-2 py-1 text-[0.85rem] font-semibold text-amber">
            <Live value={`${r.volMult.toFixed(1)}x volume`} />
          </span>
        )}
      </h2>

      <p className="mt-3 max-w-2xl text-[1.02rem] leading-relaxed text-ink-2">
        {r.name} is trading at{" "}
        <strong className="font-semibold text-ink">
          {r.volMult !== null ? `${r.volMult.toFixed(1)}x its usual rate` : money(r.volRate ?? 0) + "/hr"}
        </strong>
        , {FLOW_COPY[r.flow]}. The round trip costs {bps(r.costBps)}, so it needs a{" "}
        <strong className="font-semibold text-ink">{pct(r.breakevenPct, 2, false)}</strong> move just
        to break even — and it typically moves{" "}
        <strong className="font-semibold text-ink">{pct(r.typicalMovePct, 2, false)}</strong> in{" "}
        {cfg.holdHours}h.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-rule pt-7 sm:grid-cols-4">
        <Stat
          label="Volume vs normal"
          value={r.volMult !== null ? `${r.volMult.toFixed(1)}x` : "—"}
          note={
            r.volRate !== null
              ? `${money(r.volRate)}/hr${r.volBaseline ? ` vs ${money(r.volBaseline)}` : ""}`
              : "no baseline yet"
          }
          accent={r.volMult !== null && r.volMult >= 3 ? "text-amber" : "text-ink"}
          big
        />
        <Stat
          label={`Move (${windowMinutes}m)`}
          value={pct(r.movePct, 2)}
          note={r.moveSigma !== null ? `${Math.abs(r.moveSigma).toFixed(1)}σ for the window` : undefined}
          accent={up ? "text-forest" : "text-rust"}
        />
        <Stat
          label="Open interest"
          value={pct(r.oiDeltaPct, 2)}
          note={r.flow}
          accent={(r.oiDeltaPct ?? 0) >= 0 ? "text-forest" : "text-rust"}
        />
        <Stat
          label="Edge vs spread"
          value={r.viability !== null ? `${r.viability.toFixed(1)}x` : "—"}
          note="typical move ÷ breakeven"
          accent={(r.viability ?? 0) >= 3 ? "text-forest" : "text-amber"}
        />
      </dl>

      <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-rule pt-7 sm:grid-cols-4">
        <Stat label="Mark" value={price(r.mark)} note={`24h vol ${money(r.vol24)}`} />
        <Stat
          label="Round trip"
          value={bps(r.costBps)}
          note={`${usd((r.costBps / 1e4) * cfg.notional)} on ${money(cfg.notional)}`}
        />
        <Stat
          label="Breakeven move"
          value={pct(r.breakevenPct, 2, false)}
          note="before you make a cent"
        />
        <Stat
          label="Carry over hold"
          value={pct(r.carryOverHoldPct, 3, false)}
          note="funding is negligible here"
          accent="text-muted"
        />
      </dl>

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-rule pt-6">
        {r.bias && (
          <span className={`text-[0.85rem] font-semibold tracking-wide ${tone}`}>
            momentum favours {r.bias}
          </span>
        )}
        <span className="text-[0.78rem] text-muted">
          vol {pct(r.vol, 0, false)} annualized
          {r.volSource === "session" ? " (measured this session)" : " (from collected history)"}
        </span>
        {marks.length > 2 && <Sparkline values={marks} width={150} />}
        <Link
          href={`/market/${r.ticker}`}
          className="ml-auto border-b border-rust pb-0.5 text-[0.85rem] text-rust no-underline hover:border-ink hover:text-ink"
        >
          Depth curve for {r.ticker} →
        </Link>
      </div>

      {r.flags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {r.flags.map((f) => (
            <li key={f} className="border border-amber/40 bg-amber-soft px-2 py-0.5 text-[0.72rem] text-amber">
              {f}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 border-t border-rule pt-4 text-[0.78rem] leading-relaxed text-muted">
        A volume spike says something is happening; it does not say which way it resolves. The
        direction above is momentum continuation, not a forecast, and you are quoting against a
        single market maker who sees the same flow and widens when it gets noisy.
      </p>
    </section>
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
      <dd className={`tnum mt-1.5 font-serif leading-none ${accent} ${big ? "text-[2rem]" : "text-[1.45rem]"}`}>
        <Live value={value} />
      </dd>
      {note && <p className="tnum mt-1.5 text-[0.74rem] leading-snug text-muted">{note}</p>}
    </div>
  );
}
