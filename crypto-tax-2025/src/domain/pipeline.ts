// Pipeline orchestrator. Reads everything from Firestore, runs the
// deterministic stages in memory, and writes the derived collections back.
//
// Stages: fetch -> normalize -> classify -> fifo -> review -> persist
//
// This is idempotent — running it twice from the same raw data produces the
// same derived state. The only side effects are Firestore writes.

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
  matchedTransfers: number;
  taxableEvents: number;
  reviewItems: number;
  warnings: number;
}

export async function runPipeline(): Promise<PipelineResult> {
  // 1) Fetch raw + sources + wallets
  const [raws, sources, wallets] = await Promise.all([
    listAllRaw(),
    getDataSourcesOnce(),
    listWallets(),
  ]);

  // 2) Normalize
  const normalized = normalizeAll(sources, raws);

  // 3) Classify
  const { txs: classified, transferMatches } = classifyAll(normalized, wallets);

  // 4) FIFO basis engine
  const fifo = runFifo(classified);

  // 5) Review queue
  const reviewItems = generateReviewItems({ txs: classified, fifo });

  // 6) Persist (wipe-and-replace derived collections)
  await bulkDeleteNormalized();
  await bulkInsertNormalized(classified);
  await bulkDeleteTransferMatches();
  await bulkInsertTransferMatches(transferMatches);
  await replaceTaxableEvents(fifo.taxableEvents, fifo.lots);
  await replaceReviewItems(reviewItems);

  const result: PipelineResult = {
    rawCount: raws.length,
    normalizedCount: classified.length,
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
