"use client";

import { useState } from "react";
import { BestTrade } from "./BestTrade";
import { Controls } from "./Controls";
import { RankTable } from "./RankTable";
import { useRanked, useScreenerData } from "@/lib/useScreener";
import { ago, money } from "@/lib/format";
import { DEFAULT_CONFIG, type ScoringConfig } from "@/lib/variational/types";

const EXCLUSION_COPY: Record<string, string> = {
  pinned: "at a default funding rate (no signal)",
  "thin volume": "below the volume floor",
  "thin OI": "below the open-interest floor",
  "no carry": "no funding to collect",
  "no quote": "no usable quote",
  "slow payback": "spread too wide to earn back in time",
};

export function Screener() {
  const [cfg, setCfg] = useState<ScoringConfig>(DEFAULT_CONFIG);
  const { snapshot, histories, historyMeta, loading, error } = useScreenerData();
  const { scored, excluded } = useRanked(snapshot, histories, cfg);

  return (
    <div className="space-y-10">
      <StatusBar
        snapshot={snapshot}
        historyMeta={historyMeta}
        loading={loading}
        error={error}
        qualifying={scored.length}
      />

      <div className="sheet px-5 py-6 sm:px-7">
        <Controls cfg={cfg} onChange={setCfg} />
      </div>

      {loading && !snapshot ? (
        <Skeleton />
      ) : error && !snapshot ? (
        <Empty title="Could not reach Variational">
          The public stats endpoint did not respond: {error}. Nothing is cached client-side, so
          there is nothing to show until it comes back.
        </Empty>
      ) : scored.length === 0 ? (
        <Empty title="No position clears the filters">
          Every market failed a gate at {money(cfg.notional)}:{" "}
          {Object.entries(excluded)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${v} ${EXCLUSION_COPY[k] ?? k}`)
            .join(", ")}
          . Sitting out is the answer. Try a smaller size — the spread is what usually disqualifies
          a market, and it shrinks fast as the clip does.
        </Empty>
      ) : (
        <>
          <BestTrade r={scored[0]} cfg={cfg} />

          {scored.length > 1 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between border-b border-rust pb-2">
                <h2 className="font-serif text-[1.5rem] leading-none">Also qualifying</h2>
                <p className="text-[0.75rem] text-muted">
                  {scored.length - 1} more of {snapshot?.markets.length ?? 0} markets
                </p>
              </div>
              <RankTable rows={scored.slice(1, 25)} />
            </section>
          )}

          <ExclusionNote excluded={excluded} total={snapshot?.markets.length ?? 0} />
        </>
      )}
    </div>
  );
}

function StatusBar({
  snapshot,
  historyMeta,
  loading,
  error,
  qualifying,
}: {
  snapshot: ReturnType<typeof useScreenerData>["snapshot"];
  historyMeta: { updatedAt: number | null; runs: number };
  loading: boolean;
  error: string | null;
  qualifying: number;
}) {
  const p = snapshot?.platform;
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-rule pb-3 text-[0.78rem] text-muted">
      <span className="flex items-center gap-2">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            error ? "bg-rust" : loading ? "bg-amber" : "bg-forest pulse-dot"
          }`}
          aria-hidden="true"
        />
        {error ? "upstream error" : loading ? "loading" : "live"}
      </span>
      {snapshot && <span className="tnum">quotes {ago(snapshot.fetchedAt)}</span>}
      {p && (
        <>
          <span className="tnum">TVL {money(p.tvl)}</span>
          <span className="tnum">OI {money(p.openInterest)}</span>
          <span className="tnum">24h {money(p.volume24h)}</span>
          <span className="tnum">{p.numMarkets} markets</span>
        </>
      )}
      <span className="tnum ml-auto">
        {historyMeta.runs > 0
          ? `history: ${historyMeta.runs} collections, last ${ago(historyMeta.updatedAt)}`
          : "history: collector has not run yet"}
      </span>
      <span className="tnum">{qualifying} qualifying</span>
    </div>
  );
}

function ExclusionNote({
  excluded,
  total,
}: {
  excluded: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(excluded).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  return (
    <section className="border-t border-rule pt-6">
      <p className="eyebrow mb-3">What was filtered out</p>
      <ul className="grid gap-x-10 gap-y-2 text-[0.82rem] text-ink-2 sm:grid-cols-2">
        {entries.map(([k, v]) => (
          <li key={k} className="flex items-baseline justify-between gap-4 border-b border-rule pb-1.5">
            <span>{EXCLUSION_COPY[k] ?? k}</span>
            <span className="tnum text-muted">{v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 max-w-2xl text-[0.8rem] leading-relaxed text-muted">
        Roughly four in five markets sit at a default funding rate — 0.1095 is exactly the standard
        0.01% per 8 hours annualized, and a further slice sits at zero. Those carry no information,
        so they are excluded rather than ranked. Of {total} listed markets, only around fifty clear
        the volume floor on any given day.
      </p>
    </section>
  );
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="sheet px-6 py-12 text-center sm:px-10">
      <h2 className="font-serif text-[1.8rem] leading-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-[0.92rem] leading-relaxed text-ink-2">{children}</p>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="sheet animate-pulse px-6 py-9 sm:px-9">
      <div className="h-3 w-28 bg-rule" />
      <div className="mt-4 h-11 w-2/3 bg-rule" />
      <div className="mt-3 h-4 w-full bg-rule/60" />
      <div className="mt-2 h-4 w-4/5 bg-rule/60" />
      <div className="mt-8 grid grid-cols-2 gap-6 border-t border-rule pt-7 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-2.5 w-16 bg-rule" />
            <div className="mt-2 h-6 w-20 bg-rule/60" />
          </div>
        ))}
      </div>
    </div>
  );
}
