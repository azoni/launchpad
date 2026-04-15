// Pipeline orchestrator.
//
// Stages: fetch -> normalize -> [optional: price lookup] -> classify -> fifo -> review -> persist
//
// Price lookup is skipped by default on auto-runs (too slow for CoinGecko rate limits).
// Run with { fillPrices: true } to explicitly fill prices.

import { listAllRaw } from "../data/rawTransactions";
import { subscribeDataSources } from "../data/dataSources";
import { listWallets } from "../data/wallets";
import {
  bulkDeleteNormalized,
  bulkInsertNormalized,
} from "../data/normalizedTransactions";
import {
  bulkDeleteTransferMatches,
  bulkInsertTransferMatches,
} from "../data/transferMatches";
import { replaceTaxableEvents } from "../data/taxableEvents";
import { replaceReviewItems } from "../data/reviewItems";
import { logAudit } from "../data/auditLog";
import { normalizeAll } from "./normalize";
import { fillMissingPrices } from "./priceLookup";
import { classifyAll } from "./classify";
import { runFifo } from "./basis/fifoEngine";
import { generateReviewItems } from "./review/generate";
import type { DataSource } from "../types";

async function getDataSourcesOnce(): Promise<DataSource[]> {
  return new Promise((resolve) => {
    const unsub = subscribeDataSources((sources) => {
      unsub();
      resolve(sources);
    });
  });
}

export interface PipelineResult {
  rawCount: number;
  normalizedCount: number;
  pricesFilled: number;
  matchedTransfers: number;
  taxableEvents: number;
  reviewItems: number;
  warnings: number;
}

export interface PipelineOptions {
  fillPrices?: boolean;
}

export async function runPipeline(opts?: PipelineOptions): Promise<PipelineResult> {
  const { fillPrices = false } = opts ?? {};

  // 1) Fetch raw + sources + wallets
  const [raws, sources, wallets] = await Promise.all([
    listAllRaw(),
    getDataSourcesOnce(),
    listWallets(),
  ]);

  // 2) Normalize
  const normalized = normalizeAll(sources, raws);

  // 3) Optionally fill missing USD prices via CoinGecko
  let priced = normalized;
  let pricesFilled = 0;
  if (fillPrices) {
    const missingBefore = normalized.filter((t) => t.usdValue === null).length;
    priced = await fillMissingPrices(normalized);
    const missingAfter = priced.filter((t) => t.usdValue === null).length;
    pricesFilled = missingBefore - missingAfter;
  }

  // 4) Classify
  const { txs: classified, transferMatches } = classifyAll(priced, wallets);

  // 5) FIFO basis engine
  const fifo = runFifo(classified);

  // 6) Review queue
  const reviewItems = generateReviewItems({ txs: classified, fifo });

  // 7) Persist
  await bulkDeleteNormalized();
  await bulkInsertNormalized(classified);
  await bulkDeleteTransferMatches();
  await bulkInsertTransferMatches(transferMatches);
  await replaceTaxableEvents(fifo.taxableEvents, fifo.lots);
  await replaceReviewItems(reviewItems);

  const result: PipelineResult = {
    rawCount: raws.length,
    normalizedCount: classified.length,
    pricesFilled,
    matchedTransfers: transferMatches.length,
    taxableEvents: fifo.taxableEvents.length,
    reviewItems: reviewItems.length,
    warnings: fifo.warnings.length,
  };

  await logAudit({
    actionType: "pipeline_run",
    targetId: "pipeline",
    after: result,
  });

  return result;
}
