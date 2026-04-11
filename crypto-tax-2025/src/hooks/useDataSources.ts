import { useEffect, useState } from "react";
import { subscribeDataSources } from "../data/dataSources";
import type { DataSource } from "../types";

export function useDataSources() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeDataSources((s) => {
      setSources(s);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { sources, loading };
}
