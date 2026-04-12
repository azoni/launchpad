// Comprehensive FIFO engine tests. Every test verifies a scenario that could
// cause a wrong number on a tax return if broken.

import { describe, it, expect } from "vitest";
import { runFifo } from "./fifoEngine";
import type { NormalizedTransaction } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

const ONE_DAY = 24 * 60 * 60 * 1000;
const JAN_1 = Date.UTC(2025, 0, 1);

function tx(partial: Partial<NormalizedTransaction>): NormalizedTransaction {
  return {
    id: partial.id ?? crypto.randomUUID(),
    projectId: PROJECT_ID,
    timestamp: partial.timestamp ?? JAN_1,
    platform: "metamask",
    walletId: null,
    walletAddress: null,
    txType: "buy",
    assetSent: null,
    amountSent: null,
    assetReceived: null,
    amountReceived: null,
    feeAsset: null,
    feeAmount: null,
    usdValue: null,
    txHash: null,
    sourceId: "test",
    sourceRowRef: null,
    confidenceScore: 1,
    reviewStatus: "ok",
    ...partial,
  };
}

describe("FIFO — lot ordering and consumption", () => {
  it("FIFO order: oldest lot consumed first, not cheapest", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 3000, timestamp: JAN_1 }),
      tx({ id: "b2", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000, timestamp: JAN_1 + ONE_DAY }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 2000, timestamp: JAN_1 + 2 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    // FIFO: should use the $3000 lot (oldest), NOT the $1000 lot
    expect(r.taxableEvents[0].costBasisUsd).toBe(3000);
    expect(r.taxableEvents[0].gainLossUsd).toBe(-1000); // loss
  });

  it("partial sell splits a lot correctly", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 10, usdValue: 20000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 3, usdValue: 9000, timestamp: JAN_1 + ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    // Basis = (20000/10) * 3 = 6000
    expect(r.taxableEvents[0].costBasisUsd).toBeCloseTo(6000, 2);
    expect(r.taxableEvents[0].gainLossUsd).toBeCloseTo(3000, 2);
    // Remaining lot should have 7 ETH with $14000 basis
    expect(r.lots).toHaveLength(1);
    expect(r.lots[0].quantityRemaining).toBeCloseTo(7, 8);
    expect(r.lots[0].costBasisRemaining).toBeCloseTo(14000, 2);
  });

  it("sell across multiple lots chains correctly", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 2, usdValue: 4000, timestamp: JAN_1 }),
      tx({ id: "b2", txType: "buy", assetReceived: "ETH", amountReceived: 3, usdValue: 9000, timestamp: JAN_1 + ONE_DAY }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 4, usdValue: 12000, timestamp: JAN_1 + 2 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    // Should generate 2 events: 2 from lot 1, 2 from lot 2
    expect(r.taxableEvents).toHaveLength(2);
    // Lot 1: 2 ETH, basis $2000/ETH, proceeds $3000/ETH
    expect(r.taxableEvents[0].quantity).toBe(2);
    expect(r.taxableEvents[0].costBasisUsd).toBeCloseTo(4000, 2);
    // Lot 2: 2 ETH of 3, basis $3000/ETH, proceeds $3000/ETH
    expect(r.taxableEvents[1].quantity).toBe(2);
    expect(r.taxableEvents[1].costBasisUsd).toBeCloseTo(6000, 2);
    // Total gain
    const totalGain = r.taxableEvents.reduce((s, e) => s + e.gainLossUsd, 0);
    // proceeds 12000, basis 4000+6000=10000, gain = 2000
    expect(totalGain).toBeCloseTo(2000, 2);
  });

  it("different assets don't cross-contaminate lots", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 2000 }),
      tx({ id: "b2", txType: "buy", assetReceived: "BTC", amountReceived: 1, usdValue: 50000 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 3000, timestamp: JAN_1 + ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    expect(r.taxableEvents[0].asset).toBe("ETH");
    expect(r.taxableEvents[0].costBasisUsd).toBe(2000); // NOT $50000 from BTC
    // BTC lot should remain untouched
    expect(r.lots.find((l) => l.asset === "BTC")?.quantityRemaining).toBe(1);
  });
});

describe("FIFO — holding period", () => {
  it("exactly 365 days = short-term", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 2000, timestamp: JAN_1 + 365 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents[0].holdingPeriod).toBe("short");
    expect(r.taxableEvents[0].form8949Box).toBe("C");
  });

  it("366 days = long-term", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 2000, timestamp: JAN_1 + 366 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents[0].holdingPeriod).toBe("long");
    expect(r.taxableEvents[0].form8949Box).toBe("F");
  });

  it("sell across lots assigns per-lot holding period", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000, timestamp: JAN_1 }),
      tx({ id: "b2", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000, timestamp: JAN_1 + 400 * ONE_DAY }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 2, usdValue: 6000, timestamp: JAN_1 + 500 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(2);
    // First lot: 500 days → long-term
    expect(r.taxableEvents[0].holdingPeriod).toBe("long");
    expect(r.taxableEvents[0].form8949Box).toBe("F");
    // Second lot: 100 days → short-term
    expect(r.taxableEvents[1].holdingPeriod).toBe("short");
    expect(r.taxableEvents[1].form8949Box).toBe("C");
  });
});

describe("FIFO — swaps", () => {
  it("swap creates disposal of sent asset + new lot of received asset", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 2, usdValue: 4000 }),
      tx({
        id: "sw1",
        txType: "swap",
        assetSent: "ETH",
        amountSent: 2,
        assetReceived: "USDC",
        amountReceived: 6000,
        usdValue: 6000,
        timestamp: JAN_1 + 30 * ONE_DAY,
      }),
    ];
    const r = runFifo(txs);
    // Disposal event: sold 2 ETH at $6000, basis $4000
    expect(r.taxableEvents).toHaveLength(1);
    expect(r.taxableEvents[0].asset).toBe("ETH");
    expect(r.taxableEvents[0].gainLossUsd).toBe(2000);
    // New USDC lot should exist with basis $6000
    const usdcLot = r.lots.find((l) => l.asset === "USDC");
    expect(usdcLot).toBeDefined();
    expect(usdcLot!.costBasisRemaining).toBe(6000);
    expect(usdcLot!.quantityRemaining).toBe(6000);
  });

  it("chain of swaps preserves basis through the chain", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 2000 }),
      tx({ id: "sw1", txType: "swap", assetSent: "ETH", amountSent: 1, assetReceived: "WBTC", amountReceived: 0.05, usdValue: 2500, timestamp: JAN_1 + 10 * ONE_DAY }),
      tx({ id: "sw2", txType: "swap", assetSent: "WBTC", amountSent: 0.05, assetReceived: "USDC", amountReceived: 3000, usdValue: 3000, timestamp: JAN_1 + 20 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(2);
    // ETH → WBTC: basis 2000, proceeds 2500 → gain 500
    expect(r.taxableEvents[0].gainLossUsd).toBe(500);
    // WBTC → USDC: basis 2500 (from the swap), proceeds 3000 → gain 500
    expect(r.taxableEvents[1].gainLossUsd).toBe(500);
    // Total gain through the chain: $1000
    expect(r.taxableEvents[0].gainLossUsd + r.taxableEvents[1].gainLossUsd).toBe(1000);
  });
});

describe("FIFO — income (staking/airdrops)", () => {
  it("income creates lot at FMV and records income event", () => {
    const txs = [
      tx({ id: "i1", txType: "income", assetReceived: "SOL", amountReceived: 100, usdValue: 5000, notes: "staking" }),
    ];
    const r = runFifo(txs);
    expect(r.incomeEvents).toHaveLength(1);
    expect(r.incomeEvents[0].fairMarketValueUsd).toBe(5000);
    expect(r.incomeEvents[0].source).toBe("staking");
    // Tax lot created at FMV basis
    expect(r.lots).toHaveLength(1);
    expect(r.lots[0].costBasisRemaining).toBe(5000);
    expect(r.lots[0].quantityRemaining).toBe(100);
    // No taxable disposal event (income is not a capital gain)
    expect(r.taxableEvents).toHaveLength(0);
  });

  it("selling income-received tokens uses FMV as basis", () => {
    const txs = [
      tx({ id: "i1", txType: "income", assetReceived: "SOL", amountReceived: 100, usdValue: 5000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "SOL", amountSent: 50, usdValue: 4000, timestamp: JAN_1 + 60 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    // Basis = (5000/100)*50 = 2500
    expect(r.taxableEvents[0].costBasisUsd).toBeCloseTo(2500, 2);
    // Gain = 4000 - 2500 = 1500
    expect(r.taxableEvents[0].gainLossUsd).toBeCloseTo(1500, 2);
  });

  it("airdrop is recognized as income", () => {
    const txs = [
      tx({ id: "i1", txType: "income", assetReceived: "TOKEN", amountReceived: 1000, usdValue: 200, notes: "airdrop" }),
    ];
    const r = runFifo(txs);
    expect(r.incomeEvents[0].source).toBe("airdrop");
  });
});

describe("FIFO — perps", () => {
  it("perp realized PnL creates short-term event with correct signs", () => {
    const txs = [
      tx({ id: "p1", txType: "realized_pnl", assetReceived: "ETH", amountReceived: 1, usdValue: 500, platform: "hyperliquid" }),
      tx({ id: "p2", txType: "realized_pnl", assetReceived: "BTC", amountReceived: 1, usdValue: -300, platform: "lighter" }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(2);
    // Profit
    expect(r.taxableEvents[0].gainLossUsd).toBe(500);
    expect(r.taxableEvents[0].holdingPeriod).toBe("short");
    expect(r.taxableEvents[0].category).toBe("perp");
    // Loss
    expect(r.taxableEvents[1].gainLossUsd).toBe(-300);
    expect(r.taxableEvents[1].holdingPeriod).toBe("short");
  });

  it("perp events do NOT consume spot lots", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 5, usdValue: 10000 }),
      tx({ id: "p1", txType: "realized_pnl", assetReceived: "ETH", amountReceived: 1, usdValue: 500, timestamp: JAN_1 + ONE_DAY }),
    ];
    const r = runFifo(txs);
    // Spot lot should be untouched
    expect(r.lots).toHaveLength(1);
    expect(r.lots[0].quantityRemaining).toBe(5);
    expect(r.lots[0].costBasisRemaining).toBe(10000);
  });
});

describe("FIFO — wash sales", () => {
  it("loss followed by repurchase within 30 days triggers wash sale", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 3000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 2000, timestamp: JAN_1 + 10 * ONE_DAY }),
      tx({ id: "b2", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 2100, timestamp: JAN_1 + 20 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    const lossEvent = r.taxableEvents.find((e) => e.gainLossUsd < 0);
    expect(lossEvent).toBeDefined();
    expect(lossEvent!.washSaleDisallowed).toBe(1000);
    // Replacement lot basis adjusted: 2100 + 1000 = 3100
    const lot = r.lots.find((l) => l.asset === "ETH");
    expect(lot!.costBasisRemaining).toBeCloseTo(3100, 2);
  });

  it("loss followed by repurchase AFTER 31 days = no wash sale", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 3000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 2000, timestamp: JAN_1 + 10 * ONE_DAY }),
      tx({ id: "b2", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 2100, timestamp: JAN_1 + 45 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    const lossEvent = r.taxableEvents.find((e) => e.gainLossUsd < 0);
    expect(lossEvent).toBeDefined();
    expect(lossEvent!.washSaleDisallowed).toBe(0); // No wash sale
  });

  it("gain followed by repurchase = no wash sale (only losses)", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 2000, timestamp: JAN_1 + 10 * ONE_DAY }),
      tx({ id: "b2", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1900, timestamp: JAN_1 + 15 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents[0].washSaleDisallowed).toBe(0);
  });

  it("wash sale via swap (receiving same asset within 30 days)", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 3000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 2500, timestamp: JAN_1 + 10 * ONE_DAY }),
      tx({ id: "sw1", txType: "swap", assetSent: "USDC", amountSent: 2600, assetReceived: "ETH", amountReceived: 1, usdValue: 2600, timestamp: JAN_1 + 20 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    const lossEvent = r.taxableEvents.find((e) => e.asset === "ETH" && e.gainLossUsd < 0);
    expect(lossEvent).toBeDefined();
    expect(lossEvent!.washSaleDisallowed).toBe(500);
  });
});

describe("FIFO — missing basis and edge cases", () => {
  it("selling without prior purchase = zero basis + warning", () => {
    const txs = [
      tx({ id: "s1", txType: "sell", assetSent: "SHIB", amountSent: 1000000, usdValue: 50 }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    expect(r.taxableEvents[0].costBasisUsd).toBe(0);
    expect(r.taxableEvents[0].gainLossUsd).toBe(50);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.taxableEvents[0].notes).toContain("MISSING BASIS");
  });

  it("selling more than owned: partial from lot + remainder at zero basis", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 2000 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 3, usdValue: 9000, timestamp: JAN_1 + ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(2);
    // First: 1 ETH from the lot, basis $2000
    expect(r.taxableEvents[0].quantity).toBe(1);
    expect(r.taxableEvents[0].costBasisUsd).toBe(2000);
    // Second: 2 ETH with zero basis (missing)
    expect(r.taxableEvents[1].quantity).toBe(2);
    expect(r.taxableEvents[1].costBasisUsd).toBe(0);
    expect(r.taxableEvents[1].notes).toContain("MISSING BASIS");
  });

  it("transfers do NOT create taxable events", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 5, usdValue: 10000 }),
      tx({ id: "t1", txType: "transfer_out", assetSent: "ETH", amountSent: 5, usdValue: 15000, timestamp: JAN_1 + ONE_DAY }),
      tx({ id: "t2", txType: "transfer_in", assetReceived: "ETH", amountReceived: 5, usdValue: 15000, timestamp: JAN_1 + ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(0);
    // Lot should still exist (transfers don't consume it)
    expect(r.lots).toHaveLength(1);
    expect(r.lots[0].quantityRemaining).toBe(5);
  });

  it("spam/fee/bridge types produce no events", () => {
    const txs = [
      tx({ id: "sp", txType: "spam", assetReceived: "SCAM", amountReceived: 99999, usdValue: 0 }),
      tx({ id: "f1", txType: "fee", assetSent: "ETH", amountSent: 0.01, usdValue: 30 }),
      tx({ id: "br", txType: "bridge", assetSent: "ETH", amountSent: 1, usdValue: 3000 }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  it("same-day buy and sell works correctly", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 2000, timestamp: JAN_1 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 2100, timestamp: JAN_1 + 1 }), // 1ms later
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    expect(r.taxableEvents[0].gainLossUsd).toBe(100);
    expect(r.taxableEvents[0].holdingPeriod).toBe("short");
  });

  it("floating point: 0.1 + 0.2 quantities don't break", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 0.1, usdValue: 200 }),
      tx({ id: "b2", txType: "buy", assetReceived: "ETH", amountReceived: 0.2, usdValue: 400 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 0.3, usdValue: 900, timestamp: JAN_1 + ONE_DAY }),
    ];
    const r = runFifo(txs);
    const totalGain = r.taxableEvents.reduce((s, e) => s + e.gainLossUsd, 0);
    // Proceeds 900, basis 600, gain = 300
    expect(totalGain).toBeCloseTo(300, 2);
    // No leftover lots (all consumed)
    const ethLots = r.lots.filter((l) => l.asset === "ETH");
    expect(ethLots.length === 0 || ethLots[0].quantityRemaining < 1e-10).toBe(true);
  });
});

describe("FIFO — total reconciliation", () => {
  it("proceeds - basis = total gain across all events", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 5, usdValue: 10000, timestamp: JAN_1 }),
      tx({ id: "b2", txType: "buy", assetReceived: "BTC", amountReceived: 0.5, usdValue: 25000, timestamp: JAN_1 + ONE_DAY }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 3, usdValue: 7500, timestamp: JAN_1 + 30 * ONE_DAY }),
      tx({ id: "sw1", txType: "swap", assetSent: "BTC", amountSent: 0.5, assetReceived: "ETH", amountReceived: 10, usdValue: 30000, timestamp: JAN_1 + 60 * ONE_DAY }),
      tx({ id: "s2", txType: "sell", assetSent: "ETH", amountSent: 10, usdValue: 35000, timestamp: JAN_1 + 90 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    for (const e of r.taxableEvents) {
      // Each event's gain = proceeds - basis
      expect(e.gainLossUsd).toBeCloseTo(e.proceedsUsd - e.costBasisUsd, 2);
    }
  });
});
