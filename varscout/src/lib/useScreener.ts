"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchSnapshot } from "@/lib/variational/api";
import { rank } from "@/lib/variational/scoring";
import type { MarketHistory, ScoringConfig, Snapshot } from "@/lib/variational/types";
import type { AggregatesResponse } from "@/app/api/aggregates/route";

/** Matches the upstream refresh: quotes land within a ~60s band. */
const LIVE_INTERVAL_MS = 45_000;
/** The collector only writes every 5 minutes, so polling faster is wasted. */
const HISTORY_INTERVAL_MS = 300_000;

export interface ScreenerState {
  snapshot: Snapshot | null;
  histories: Record<string, MarketHistory>;
  historyMeta: { updatedAt: number | null; runs: number };
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useScreenerData(): ScreenerState {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [raw, setRaw] = useState<AggregatesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const abort = useRef<AbortController | null>(null);

  const loadLive = useCallback(async () => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const snap = await fetchSnapshot(ctrl.signal);
      setSnapshot(snap);
      setError(null);
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Could not reach the Variational endpoint");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/aggregates");
      if (res.ok) setRaw((await res.json()) as AggregatesResponse);
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
  // which only the live snapshot knows. The API returns the raw counters so the
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
    historyMeta: { updatedAt: raw?.updatedAt ?? null, runs: raw?.runs ?? 0 },
    loading,
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
