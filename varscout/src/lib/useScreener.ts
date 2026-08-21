"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSnapshot } from "@/lib/variational/api";
import { rank } from "@/lib/variational/scoring";
import { rankPulse, type PulseConfig, type Tick } from "@/lib/variational/pulse";
import type { MarketHistory, ScoringConfig, Snapshot } from "@/lib/variational/types";
import type { AggregatesResponse } from "@/app/api/aggregates/route";

/**
 * Upstream serves a cached snapshot that advances in discrete steps of roughly
 * 70 seconds — six polls 8s apart returned byte-identical data, then 439 quotes
 * moved at once. Polling faster than this buys nothing; 20s guarantees catching
 * each new step promptly without hammering an endpoint that will not have
 * changed.
 */
const LIVE_INTERVAL_MS = 20_000;
const HISTORY_INTERVAL_MS = 300_000;

/** Ticks retained per market. At ~70s per upstream step this is roughly 2 hours. */
const TICK_CAP = 100;

export interface ScreenerState {
  snapshot: Snapshot | null;
  histories: Record<string, MarketHistory>;
  buffers: Record<string, Tick[]>;
  historyMeta: { updatedAt: number | null; runs: number };
  /** Upstream timestamp of the newest tick actually observed, in ms. */
  lastTickAt: number | null;
  /** Increments only when upstream data genuinely advanced. */
  tickCount: number;
  loading: boolean;
  seeded: boolean;
  error: string | null;
  refresh: () => void;
}

const toSeconds = (iso: string): number => {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : NaN;
};

export function useScreenerData(): ScreenerState {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [raw, setRaw] = useState<AggregatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);

  // Buffers live in a ref because they are appended to on every poll; a state
  // object would rebuild the whole map each time. tickCount is the render signal.
  const buffers = useRef<Record<string, Tick[]>>({});
  const abort = useRef<AbortController | null>(null);

  /**
   * Append a snapshot's markets to their buffers, keyed on the venue's own
   * quote timestamp. Polls that return the same cached snapshot are dropped —
   * counting them as samples would divide real volume by fake elapsed time and
   * understate every rate.
   */
  const ingest = useCallback((snap: Snapshot) => {
    let advanced = 0;
    let newest = 0;
    for (const m of snap.markets) {
      const ts = toSeconds(m.quoteTs);
      if (!Number.isFinite(ts)) continue;
      newest = Math.max(newest, ts);
      const buf = (buffers.current[m.ticker] ??= []);
      if (buf.length && buf[buf.length - 1].ts >= ts) continue;
      buf.push({ ts, mark: m.mark, vol24: m.vol24, oi: m.oiLong + m.oiShort, funding: m.funding });
      if (buf.length > TICK_CAP) buf.splice(0, buf.length - TICK_CAP);
      advanced++;
    }
    if (advanced > 0) {
      setTickCount((c) => c + 1);
      if (newest) setLastTickAt(newest * 1000);
    }
    return advanced;
  }, []);

  const loadLive = useCallback(async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const snap = await fetchSnapshot(ctrl.signal);
      setSnapshot(snap);
      ingest(snap);
      setError(null);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Could not reach the Variational endpoint");
      }
    } finally {
      setLoading(false);
    }
  }, [ingest]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/aggregates");
      if (!res.ok) return;
      const data = (await res.json()) as AggregatesResponse;
      setRaw(data);

      // Seed once, and only ahead of live ticks — the collector samples every 5
      // minutes, so its points are older and coarser than anything already
      // observed in-session.
      setSeeded((already) => {
        if (already || !data.seed) return already;
        for (const [ticker, s] of Object.entries(data.seed)) {
          if (!s?.t?.length) continue;
          const buf = (buffers.current[ticker] ??= []);
          const earliestLive = buf.length ? buf[0].ts : Infinity;
          const seedTicks: Tick[] = [];
          for (let i = 0; i < s.t.length; i++) {
            if (s.t[i] >= earliestLive) break;
            seedTicks.push({ ts: s.t[i], mark: s.m[i], vol24: s.v[i], oi: s.o[i], funding: 0 });
          }
          if (seedTicks.length) {
            buf.unshift(...seedTicks);
            if (buf.length > TICK_CAP) buf.splice(0, buf.length - TICK_CAP);
          }
        }
        setTickCount((c) => c + 1);
        return true;
      });
    } catch {
      /* history is an enhancement — the screener still works without it */
    }
  }, []);

  useEffect(() => {
    loadLive();
    loadHistory();
    const a = setInterval(loadLive, LIVE_INTERVAL_MS);
    const b = setInterval(loadHistory, HISTORY_INTERVAL_MS);
    return () => {
      clearInterval(a);
      clearInterval(b);
      abort.current?.abort();
    };
  }, [loadLive, loadHistory]);

  // Sign stability has to be measured against the sign funding has *right now*,
  // which only the live snapshot knows. The API returns raw counters so the
  // ratio can be re-derived here rather than baked in at collection time.
  const histories = useMemo(() => {
    if (!raw?.histories) return {};
    if (!snapshot) return raw.histories;
    const live = new Map(snapshot.markets.map((m) => [m.ticker, m.funding]));
    const out: Record<string, MarketHistory> = {};
    for (const [ticker, h] of Object.entries(raw.histories)) {
      const f = live.get(ticker);
      if (f === undefined || f === 0 || h.posN === undefined || h.negN === undefined || !h.n) {
        out[ticker] = h;
      } else {
        out[ticker] = { ...h, signStability: (f > 0 ? h.posN : h.negN) / h.n };
      }
    }
    return out;
  }, [raw, snapshot]);

  return {
    snapshot,
    histories,
    buffers: buffers.current,
    historyMeta: { updatedAt: raw?.updatedAt ?? null, runs: raw?.runs ?? 0 },
    lastTickAt,
    tickCount,
    loading,
    seeded,
    error,
    refresh: loadLive,
  };
}

export function useRanked(
  snapshot: Snapshot | null,
  histories: Record<string, MarketHistory>,
  cfg: ScoringConfig,
) {
  return useMemo(() => {
    if (!snapshot) return { scored: [], excluded: {} };
    return rank(snapshot.markets, histories, cfg);
  }, [snapshot, histories, cfg]);
}

/** Slice each buffer to the trailing window the pulse view is measuring over. */
export function sliceWindow(
  buffers: Record<string, Tick[]>,
  minutes: number,
  nowS: number,
): Record<string, Tick[]> {
  const cutoff = nowS - minutes * 60;
  const out: Record<string, Tick[]> = {};
  for (const [ticker, ticks] of Object.entries(buffers)) {
    const w = ticks.filter((t) => t.ts >= cutoff);
    if (w.length) out[ticker] = w;
  }
  return out;
}

export function usePulsed(
  snapshot: Snapshot | null,
  buffers: Record<string, Tick[]>,
  histories: Record<string, MarketHistory>,
  cfg: PulseConfig,
  windowMinutes: number,
  tickCount: number,
) {
  return useMemo(() => {
    if (!snapshot) return { scored: [], excluded: {} };
    const nowS = Math.floor(snapshot.fetchedAt / 1000);
    return rankPulse(snapshot.markets, sliceWindow(buffers, windowMinutes, nowS), histories, cfg);
    // tickCount is the signal that the mutable buffers ref changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, histories, cfg, windowMinutes, tickCount]);
}
