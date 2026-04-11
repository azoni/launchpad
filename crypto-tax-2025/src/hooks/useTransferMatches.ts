import { useEffect, useState } from "react";
import { subscribeTransferMatches } from "../data/transferMatches";
import type { TransferMatch } from "../types";

export function useTransferMatches() {
  const [matches, setMatches] = useState<TransferMatch[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeTransferMatches((m) => {
      setMatches(m);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { matches, loading };
}
