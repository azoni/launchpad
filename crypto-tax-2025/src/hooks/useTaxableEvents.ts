import { useEffect, useState } from "react";
import { subscribeTaxableEvents } from "../data/taxableEvents";
import type { TaxableEvent } from "../types";

export function useTaxableEvents() {
  const [events, setEvents] = useState<TaxableEvent[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeTaxableEvents((e) => {
      setEvents(e);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { events, loading };
}
