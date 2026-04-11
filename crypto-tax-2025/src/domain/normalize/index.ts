// Top-level normalizer router. Picks the right per-source normalizer based on
// the data source's `type` and produces NormalizedTransaction rows.

import type {
  DataSource,
  NormalizedTransaction,
  RawTransaction,
} from "../../types";
import { normalizeHyperliquidRow } from "./csvHyperliquid";
import { normalizeLighterRow } from "./csvLighter";
import { normalizeGenericRow } from "./csvGeneric";
import { normalizeEvmRow } from "./evmTx";
import { normalizeSolanaRow } from "./solanaTx";

export function normalizeAll(
  sources: DataSource[],
  raws: RawTransaction[]
): NormalizedTransaction[] {
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const out: NormalizedTransaction[] = [];

  for (const raw of raws) {
    const src = sourceMap.get(raw.sourceId);
    if (!src) continue;

    let n: NormalizedTransaction | null = null;
    switch (src.type) {
      case "hyperliquid_csv":
        n = normalizeHyperliquidRow(raw, raw.id);
        break;
      case "lighter_csv":
        n = normalizeLighterRow(raw, raw.id);
        break;
      case "generic_csv":
        n = normalizeGenericRow(raw, raw.id);
        break;
      case "evm_wallet":
        n = normalizeEvmRow(raw, raw.id);
        break;
      case "solana_wallet":
        n = normalizeSolanaRow(raw, raw.id);
        break;
    }
    if (n) out.push(n);
  }

  return out;
}

export { normalizeHyperliquidRow, normalizeLighterRow, normalizeGenericRow };
