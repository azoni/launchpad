import { useEffect, useState } from "react";
import { subscribeNormalized } from "../data/normalizedTransactions";
import type { NormalizedTransaction } from "../types";

export function useTransactions() {
  const [txs, setTxs] = useState<NormalizedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeNormalized((t) => {
      setTxs(t);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { txs, loading };
}
