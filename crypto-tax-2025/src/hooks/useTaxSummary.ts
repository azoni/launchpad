import { useMemo } from "react";
import { useTaxableEvents } from "./useTaxableEvents";
import { summarizeTax } from "../domain/aggregate";

export function useTaxSummary() {
  const { events, loading } = useTaxableEvents();
  const summary = useMemo(() => summarizeTax(events), [events]);
  return { summary, events, loading };
}
