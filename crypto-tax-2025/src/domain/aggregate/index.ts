// Memoizable selectors for chart data. Pure functions over the same data the
// tables read from. Cheap to recompute on filter changes.

import type { NormalizedTransaction, TaxableEvent } from "../../types";

export interface MonthlyBucket {
  month: string; // YYYY-MM
  short: number;
  long: number;
  nft: number;
  perp: number;
  net: number;
}

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function pnlByMonth(events: TaxableEvent[]): MonthlyBucket[] {
  const map = new Map<string, MonthlyBucket>();
  for (const e of events) {
    const k = monthKey(e.dateSold);
    const b = map.get(k) ?? { month: k, short: 0, long: 0, nft: 0, perp: 0, net: 0 };
    if (e.category === "perp") b.perp += e.gainLossUsd;
    else if (e.category === "nft") b.nft += e.gainLossUsd;
    else if (e.holdingPeriod === "long") b.long += e.gainLossUsd;
    else b.short += e.gainLossUsd;
    b.net = b.short + b.long + b.nft + b.perp;
    map.set(k, b);
  }
  // Fill the 12 months of 2025 even if empty
  const out: MonthlyBucket[] = [];
  for (let m = 1; m <= 12; m++) {
    const k = `2025-${String(m).padStart(2, "0")}`;
    out.push(map.get(k) ?? { month: k, short: 0, long: 0, nft: 0, perp: 0, net: 0 });
  }
  return out;
}

export interface PlatformBucket {
  platform: string;
  proceeds: number;
  net: number;
  count: number;
}

export function activityByPlatform(events: TaxableEvent[]): PlatformBucket[] {
  const map = new Map<string, PlatformBucket>();
  for (const e of events) {
    const b = map.get(e.platform) ?? {
      platform: e.platform,
      proceeds: 0,
      net: 0,
      count: 0,
    };
    b.proceeds += e.proceedsUsd;
    b.net += e.gainLossUsd;
    b.count += 1;
    map.set(e.platform, b);
  }
  return Array.from(map.values()).sort((a, b) => b.proceeds - a.proceeds);
}

export interface WalletBucket {
  wallet: string;
  count: number;
  totalIn: number;
  totalOut: number;
  net: number;
}

export function activityByWallet(txs: NormalizedTransaction[]): WalletBucket[] {
  const map = new Map<string, WalletBucket>();
  for (const t of txs) {
    if (!t.walletAddress) continue;
    const b = map.get(t.walletAddress) ?? {
      wallet: t.walletAddress,
      count: 0,
      totalIn: 0,
      totalOut: 0,
      net: 0,
    };
    b.count += 1;
    if (t.amountReceived) b.totalIn += t.usdValue ?? 0;
    if (t.amountSent) b.totalOut += t.usdValue ?? 0;
    b.net = b.totalIn - b.totalOut;
    map.set(t.walletAddress, b);
  }
  return Array.from(map.values());
}

export interface AssetBucket {
  asset: string;
  count: number;
  totalUsd: number;
}

export function activityByAsset(txs: NormalizedTransaction[]): AssetBucket[] {
  const map = new Map<string, AssetBucket>();
  for (const t of txs) {
    const a = t.assetReceived ?? t.assetSent;
    if (!a) continue;
    const b = map.get(a) ?? { asset: a, count: 0, totalUsd: 0 };
    b.count += 1;
    b.totalUsd += Math.abs(t.usdValue ?? 0);
    map.set(a, b);
  }
  return Array.from(map.values()).sort((a, b) => b.totalUsd - a.totalUsd);
}

export interface DailyBucket {
  date: string;
  count: number;
  volumeUsd: number;
}

export function txByDay(txs: NormalizedTransaction[]): DailyBucket[] {
  const map = new Map<string, DailyBucket>();
  for (const t of txs) {
    const d = new Date(t.timestamp).toISOString().slice(0, 10);
    const b = map.get(d) ?? { date: d, count: 0, volumeUsd: 0 };
    b.count += 1;
    b.volumeUsd += Math.abs(t.usdValue ?? 0);
    map.set(d, b);
  }
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface TaxSummary {
  shortProceeds: number;
  shortBasis: number;
  shortGain: number;
  shortWashSale: number;
  longProceeds: number;
  longBasis: number;
  longGain: number;
  longWashSale: number;
  nftNet: number;
  perpNet: number;
  totalWashSale: number;
  totalNet: number;
  totalNetAfterWash: number;
}

export function summarizeTax(events: TaxableEvent[]): TaxSummary {
  const s: TaxSummary = {
    shortProceeds: 0,
    shortBasis: 0,
    shortGain: 0,
    shortWashSale: 0,
    longProceeds: 0,
    longBasis: 0,
    longGain: 0,
    longWashSale: 0,
    nftNet: 0,
    perpNet: 0,
    totalWashSale: 0,
    totalNet: 0,
    totalNetAfterWash: 0,
  };
  for (const e of events) {
    if (e.category === "perp") {
      s.perpNet += e.gainLossUsd;
    } else if (e.category === "nft") {
      s.nftNet += e.gainLossUsd;
    } else if (e.holdingPeriod === "long") {
      s.longProceeds += e.proceedsUsd;
      s.longBasis += e.costBasisUsd;
      s.longGain += e.gainLossUsd;
      s.longWashSale += e.washSaleDisallowed;
    } else {
      s.shortProceeds += e.proceedsUsd;
      s.shortBasis += e.costBasisUsd;
      s.shortGain += e.gainLossUsd;
      s.shortWashSale += e.washSaleDisallowed;
    }
  }
  s.totalWashSale = s.shortWashSale + s.longWashSale;
  s.totalNet = s.shortGain + s.longGain + s.nftNet + s.perpNet;
  s.totalNetAfterWash = s.totalNet + s.totalWashSale; // wash sale adds back disallowed losses
  return s;
}
