import { describe, it, expect } from "vitest";
import { runFifo } from "./fifoEngine";
import type { NormalizedTransaction } from "../../types";
import { PROJECT_ID } from "../../lib/collections";

const ONE_DAY = 24 * 60 * 60 * 1000;
const JAN_1_2025 = Date.UTC(2025, 0, 1);

function tx(partial: Partial<NormalizedTransaction>): NormalizedTransaction {
  return {
    id: partial.id ?? crypto.randomUUID(),
    projectId: PROJECT_ID,
    timestamp: partial.timestamp ?? JAN_1_2025,
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

describe("FIFO engine", () => {
  it("simple buy then sell — short term gain", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000, timestamp: JAN_1_2025 }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 1, usdValue: 1500, timestamp: JAN_1_2025 + 30 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    expect(r.taxableEvents[0].gainLossUsd).toBe(500);
    expect(r.taxableEvents[0].holdingPeriod).toBe("short");
  });

  it("partial sell consumes oldest lot first", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 2, usdValue: 2000, timestamp: JAN_1_2025 }),
      tx({ id: "b2", txType: "buy", assetReceived: "ETH", amountReceived: 2, usdValue: 4000, timestamp: JAN_1_2025 + ONE_DAY }),
      tx({ id: "s1", txType: "sell", assetSent: "ETH", amountSent: 3, usdValue: 4500, timestamp: JAN_1_2025 + 2 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    // Sells 2 from $1000/eth lot, 1 from $2000/eth lot
    // Proceeds for first slice: 4500 * 2/3 = 3000, basis 2000 -> gain 1000
    // Proceeds for second slice: 4500 * 1/3 = 1500, basis 2000 -> gain -500
    expect(r.taxableEvents).toHaveLength(2);
    const total = r.taxableEvents.reduce((s, e) => s + e.gainLossUsd, 0);
    expect(total).toBeCloseTo(500, 6);
  });

  it("long-term holding period split (>1 year)", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "BTC", amountReceived: 1, usdValue: 30000, timestamp: JAN_1_2025 }),
      tx({ id: "s1", txType: "sell", assetSent: "BTC", amountSent: 1, usdValue: 50000, timestamp: JAN_1_2025 + 400 * ONE_DAY }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents[0].holdingPeriod).toBe("long");
    expect(r.taxableEvents[0].gainLossUsd).toBe(20000);
  });

  it("swap is treated as sell + new lot", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000 }),
      tx({
        id: "sw1",
        txType: "swap",
        assetSent: "ETH",
        amountSent: 1,
        assetReceived: "USDC",
        amountReceived: 1500,
        usdValue: 1500,
        timestamp: JAN_1_2025 + 30 * ONE_DAY,
      }),
      tx({
        id: "s1",
        txType: "sell",
        assetSent: "USDC",
        amountSent: 1500,
        usdValue: 1500,
        timestamp: JAN_1_2025 + 60 * ONE_DAY,
      }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(2);
    // Swap leg: sell ETH at 1500, basis 1000 -> +500
    expect(r.taxableEvents[0].gainLossUsd).toBe(500);
    // USDC sell at 1500 with basis 1500 -> 0
    expect(r.taxableEvents[1].gainLossUsd).toBe(0);
  });

  it("perp realized PnL becomes a perp-category event", () => {
    const txs = [
      tx({
        id: "p1",
        txType: "realized_pnl",
        platform: "hyperliquid",
        usdValue: -250,
        amountReceived: 1,
        assetReceived: "ETH",
      }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    expect(r.taxableEvents[0].category).toBe("perp");
    expect(r.taxableEvents[0].gainLossUsd).toBe(-250);
    expect(r.taxableEvents[0].holdingPeriod).toBe("short");
  });

  it("disposal without basis emits event with zero basis and a warning", () => {
    const txs = [
      tx({ id: "s1", txType: "sell", assetSent: "DOGE", amountSent: 100, usdValue: 30 }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(1);
    expect(r.taxableEvents[0].costBasisUsd).toBe(0);
    expect(r.taxableEvents[0].gainLossUsd).toBe(30);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("transfers are non-taxable", () => {
    const txs = [
      tx({ id: "b1", txType: "buy", assetReceived: "ETH", amountReceived: 1, usdValue: 1000 }),
      tx({
        id: "t1",
        txType: "transfer_out",
        assetSent: "ETH",
        amountSent: 1,
        usdValue: 1500,
      }),
    ];
    const r = runFifo(txs);
    expect(r.taxableEvents).toHaveLength(0);
  });
});
