import Link from "next/link";
import { Live } from "./Live";
import { bps, pct } from "@/lib/format";
import type { Pulsed } from "@/lib/variational/pulse";

const HEAD: [string, boolean][] = [
  ["", false],
  ["Market", false],
  ["Move", true],
  ["Volume", true],
  ["OI", true],
  ["Flow", false],
  ["Breakeven", true],
  ["Edge", true],
  ["Cost", true],
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
                <td className={`tnum px-2 py-3 text-right font-medium ${up ? "text-forest" : "text-rust"}`}>
                  <Live value={pct(r.movePct, 2)} />
                  {r.moveSigma !== null && (
                    <span className="ml-1.5 text-[0.7rem] text-muted">
                      {Math.abs(r.moveSigma).toFixed(1)}σ
                    </span>
                  )}
                </td>
                <td className={`tnum px-2 py-3 text-right ${hot ? "font-semibold text-amber" : "text-ink-2"}`}>
                  <Live value={r.volMult !== null ? `${r.volMult.toFixed(1)}x` : "—"} />
                </td>
                <td className={`tnum px-2 py-3 text-right ${(r.oiDeltaPct ?? 0) >= 0 ? "text-ink-2" : "text-rust"}`}>
                  {pct(r.oiDeltaPct, 1)}
                </td>
                <td className="px-2 py-3 text-[0.78rem] text-muted">{r.flow}</td>
                <td className="tnum px-2 py-3 text-right text-ink-2">{pct(r.breakevenPct, 2, false)}</td>
                <td
                  className={`tnum px-2 py-3 text-right ${(r.viability ?? 0) >= 3 ? "text-forest" : "text-ink-2"}`}
                >
                  {r.viability !== null ? `${r.viability.toFixed(1)}x` : "—"}
                </td>
                <td className="tnum px-2 py-3 text-right text-muted">{bps(r.costBps)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-3 text-[0.75rem] text-muted">
        Edge is the typical move over your holding window divided by the move needed to clear the
        spread. Below 1x, a normal move does not cover the round trip.
      </p>
    </div>
  );
}
