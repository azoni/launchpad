import { useMemo, useState } from "react";
import { useReviewQueue } from "../hooks/useReviewQueue";
import { useTransactions } from "../hooks/useTransactions";
import { Card, CardHeader } from "../components/ui/Card";
import { ReviewItemCard } from "../components/review/ReviewItemCard";
import { Select, Label, Input } from "../components/ui/Input";
import { ProgressBar } from "../components/ui/ProgressBar";
import { ISSUE_LABELS } from "../domain/review/issueTypes";
import type { IssueType } from "../types";

export function ReviewQueuePage() {
  const { open, total, progress, loading } = useReviewQueue();
  const { txs } = useTransactions();
  const txById = useMemo(() => new Map(txs.map((t) => [t.id, t])), [txs]);

  const [issueFilter, setIssueFilter] = useState<IssueType | "all">("all");
  const [minImpact, setMinImpact] = useState<number>(0);

  const filtered = useMemo(() => {
    return open.filter((i) => {
      if (issueFilter !== "all" && i.issueType !== issueFilter) return false;
      if (Math.abs(i.impactUsd) < minImpact) return false;
      return true;
    });
  }, [open, issueFilter, minImpact]);

  if (loading) return <div className="text-[color:var(--color-ink-faint)]">Loading review queue…</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[color:var(--color-ink)]">Review Queue</h1>
          <p className="text-sm text-[color:var(--color-ink-faint)]">
            {open.length} unresolved · sorted by dollar impact
          </p>
        </div>
      </header>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-[color:var(--color-ink-soft)]">
            {total - open.length} of {total} resolved
          </div>
          <div className="tabular text-sm font-semibold">{progress.toFixed(0)}%</div>
        </div>
        <ProgressBar value={progress} />
      </Card>

      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="issue">Issue type</Label>
            <Select
              id="issue"
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value as IssueType | "all")}
            >
              <option value="all">All</option>
              {Object.entries(ISSUE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="impact">Min impact (USD)</Label>
            <Input
              id="impact"
              type="number"
              value={minImpact}
              onChange={(e) => setMinImpact(Number(e.target.value) || 0)}
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-sm text-[color:var(--color-ink-faint)]">
            Nothing here matches your filters. Either you're done or the threshold is too tight.
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <ReviewItemCard
              key={item.id}
              item={item}
              tx={item.transactionId ? txById.get(item.transactionId) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
