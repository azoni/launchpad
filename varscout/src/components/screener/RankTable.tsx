import Link from "next/link";
import { bps, duration, money, pct } from "@/lib/format";
import type { Scored } from "@/lib/variational/types";

const HEAD = [
  ["", "w-8"],
  ["Position", ""],
  ["Net APR", "text-right"],
  ["Carry", "text-right"],
  ["Cost", "text-right"],
  ["Payback", "text-right"],
  ["Carry/vol", "text-right"],
  ["24h vol", "text-right"],
  ["Status", "text-right"],
] as const;

export function RankTable({ rows, startIndex = 2 }: { rows: Scored[]; startIndex?: number }) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-[0.86rem]">
        <thead>
          <tr className="border-b border-rule-2">
            {HEAD.map(([label, cls]) => (
              <th
                key={label}
                scope="col"
                className={`eyebrow whitespace-nowrap px-2 pb-2 font-semibold ${cls} ${
                  cls.includes("right") ? "text-right" : "text-left"
                }`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.ticker} className="row-lift border-b border-rule">
              <td className="tnum px-2 py-3 text-[0.75rem] text-muted">{startIndex + i}</td>
              <td className="px-2 py-3">
                <Link href={`/market/${r.ticker}`} className="no-underline">
                  <span
                    className={`mr-2 text-[0.7rem] font-semibold tracking-wider ${
                      r.direction === "SHORT" ? "text-rust" : "text-forest"
                    }`}
                  >
                    {r.direction}
                  </span>
                  <span className="font-medium text-ink hover:text-rust">{r.ticker}</span>
                  <span className="ml-2 text-[0.76rem] text-muted">{r.name}</span>
                </Link>
              </td>
              <td className="tnum px-2 py-3 text-right font-medium text-ink">{pct(r.netApr)}</td>
              <td className="tnum px-2 py-3 text-right text-ink-2">{pct(r.carryApr)}</td>
              <td className="tnum px-2 py-3 text-right text-ink-2">{bps(r.costBps)}</td>
              <td className="tnum px-2 py-3 text-right text-ink-2">{duration(r.paybackDays)}</td>
              <td className="tnum px-2 py-3 text-right text-ink-2">
                {r.carryVol === null ? <span className="text-muted">—</span> : r.carryVol.toFixed(2)}
              </td>
              <td className="tnum px-2 py-3 text-right text-ink-2">{money(r.vol24)}</td>
              <td className="px-2 py-3 text-right">
                <span
                  className={`text-[0.7rem] font-semibold tracking-wide ${
                    r.provisional ? "text-amber" : "text-forest"
                  }`}
                >
                  {r.provisional ? "PROV" : "CONF"}
                </span>
                {r.flags.filter((f) => f !== "provisional").length > 0 && (
                  <span className="ml-2 text-[0.7rem] text-muted">
                    {r.flags.filter((f) => f !== "provisional").slice(0, 2).join(", ")}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
