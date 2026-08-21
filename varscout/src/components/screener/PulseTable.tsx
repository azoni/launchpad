import Link from "next/link";
import { Live } from "./Live";
import { bps, money, pct } from "@/lib/format";
import type { Pulsed } from "@/lib/variational/pulse";

const HEAD: [string, boolean][] = [
  ["", false],
  ["Market", false],
  ["24h", true],
  ["Move", true],
  ["Spike", true],
  ["Real vol 24h", true],
  ["On Omni", true],
  ["Flow", false],
  ["Edge", true],
];

export function PulseTable({ rows, startIndex = 2 }: { rows: Pulsed[]; startIndex?: number }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[50rem] border-collapse text-[0.86rem]">
        <thead>
          <tr className="border-b border-rule-2">
            {HEAD.map(([label, right]) => (
              <th
                key={label}
                scope="col"
                className={`eyebrow whitespace-nowrap px-2 pb-2 font-semibold ${right ? "text-right" : "text-left"}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const up = (r.movePct ?? 0) >= 0;
            const hot = r.volMult !== null && r.volMult >= 3;
            return (
              <tr key={r.ticker} className="row-lift border-b border-rule">
                <td className="tnum px-2 py-3 text-[0.75rem] text-muted">{startIndex + i}</td>
                <td className="px-2 py-3">
                  <Link href={`/market/${r.ticker}`} className="no-underline">
                    <span className="font-medium text-ink hover:text-rust">{r.ticker}</span>
                    <span className="ml-2 text-[0.76rem] text-muted">{r.name}</span>
                  </Link>
                </td>
                <td
                  className={`tnum px-2 py-3 text-right font-medium ${
                    (r.refPct24 ?? 0) >= 0 ? "text-forest" : "text-rust"
                  }`}
                >
                  {r.refPct24 !== null ? pct(r.refPct24, 1) : <span className="text-muted">—</span>}
                </td>
                <td className={`tnum px-2 py-3 text-right ${up ? "text-forest" : "text-rust"}`}>
                  <Live value={pct(r.movePct, 2)} />
                  {r.moveSigma !== null && (
                    <span className="ml-1.5 text-[0.7rem] text-muted">
                      {Math.abs(r.moveSigma).toFixed(1)}σ
                    </span>
                  )}
                </td>
                <td className={`tnum px-2 py-3 text-right ${hot ? "font-semibold text-amber" : "text-ink-2"}`}>
                  <Live value={r.volMult !== null ? `${r.volMult.toFixed(1)}x` : "—"} />
                  {r.spikeSource === "inferred" && (
                    <span className="ml-1 text-[0.65rem] text-muted">est</span>
                  )}
                </td>
                <td className="tnum px-2 py-3 text-right text-ink-2">
                  {r.refVol24 !== null ? money(r.refVol24) : <span className="text-muted">—</span>}
                </td>
                <td className="tnum px-2 py-3 text-right text-muted">{money(r.vol24)}</td>
                <td className="px-2 py-3 text-[0.78rem] text-muted">{r.flow}</td>
                <td
                  className={`tnum px-2 py-3 text-right ${(r.viability ?? 0) >= 3 ? "text-forest" : "text-ink-2"}`}
                >
                  {r.viability !== null ? `${r.viability.toFixed(1)}x` : "—"}
                  <span className="ml-1.5 text-[0.68rem] text-muted">{bps(r.costBps, 0)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 max-w-3xl text-[0.75rem] leading-relaxed text-muted">
        <strong className="text-ink-2">Real vol 24h</strong> is the token&rsquo;s global turnover from
        Binance; <strong className="text-ink-2">On Omni</strong> is what trades on this venue, which
        is typically 10–100x smaller and decides only whether you can get filled.{" "}
        <strong className="text-ink-2">Spike</strong> compares the latest real 5-minute volume bar
        against the median of the previous twelve — marked <em>est</em> where it had to be inferred
        from Omni&rsquo;s rolling figure instead. <strong className="text-ink-2">Edge</strong> is the
        typical move over your holding window divided by the move needed to clear the spread, with
        the round-trip cost beside it; below 1x a normal move does not cover the trade.
      </p>
    </div>
  );
}
