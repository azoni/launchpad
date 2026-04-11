import { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { NormalizedTransaction, ReviewItem, TxType } from "../../types";
import { formatUsd, formatDate, shortAddress } from "../../lib/format";
import { resolveReviewItem } from "../../data/reviewItems";
import { patchNormalized } from "../../data/normalizedTransactions";
import { ISSUE_LABELS } from "../../domain/review/issueTypes";

interface Props {
  item: ReviewItem;
  tx: NormalizedTransaction | undefined;
}

const ACTIONS: Array<{ label: string; type: TxType; tone?: "primary" | "secondary" }> = [
  { label: "Mark transfer", type: "transfer_in" },
  { label: "Mark swap", type: "swap" },
  { label: "Mark buy", type: "buy" },
  { label: "Mark sell", type: "sell" },
  { label: "Ignore as spam", type: "spam" },
];

export function ReviewItemCard({ item, tx }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);

  async function applyAction(type: TxType) {
    setBusy(true);
    try {
      if (tx) {
        await patchNormalized(tx.id, { txType: type, reviewStatus: "resolved" });
      }
      await resolveReviewItem(item.id, `Marked as ${type}`);
    } finally {
      setBusy(false);
    }
  }

  async function getExplanation() {
    setLlmLoading(true);
    try {
      const res = await fetch("/api/llm-classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item,
          tx: tx ?? null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { explanation: string };
      setExplanation(data.explanation);
    } catch (e) {
      setExplanation(`AI helper unavailable: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLlmLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge tone="amber">{ISSUE_LABELS[item.issueType]}</Badge>
            <Badge tone="neutral">
              impact {formatUsd(Math.abs(item.impactUsd))}
            </Badge>
          </div>
          <div className="text-sm font-medium text-[color:var(--color-ink)]">{item.issueSummary}</div>
          <div className="mt-1 text-xs text-[color:var(--color-ink-faint)]">
            Suggested: {item.suggestedResolution}
          </div>
        </div>
      </div>

      {tx && (
        <div className="mb-3 rounded-md bg-[color:var(--color-paper)] p-3 text-xs text-[color:var(--color-ink-soft)]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="text-[color:var(--color-ink-faint)]">Date:</span> {formatDate(tx.timestamp)}
            </div>
            <div>
              <span className="text-[color:var(--color-ink-faint)]">Platform:</span> {tx.platform}
            </div>
            <div>
              <span className="text-[color:var(--color-ink-faint)]">Type:</span> {tx.txType}
            </div>
            <div>
              <span className="text-[color:var(--color-ink-faint)]">USD:</span> {formatUsd(tx.usdValue)}
            </div>
            <div>
              <span className="text-[color:var(--color-ink-faint)]">Asset:</span>{" "}
              {tx.assetReceived ?? tx.assetSent ?? "—"}
            </div>
            <div>
              <span className="text-[color:var(--color-ink-faint)]">Wallet:</span>{" "}
              {tx.walletAddress ? shortAddress(tx.walletAddress) : "—"}
            </div>
          </div>
          {expanded && (
            <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[10px] text-[color:var(--color-ink-faint)]">
              {JSON.stringify(tx, null, 2)}
            </pre>
          )}
          <button
            className="mt-2 text-xs text-[color:var(--color-ink-faint)] underline"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide raw" : "Show raw context"}
          </button>
        </div>
      )}

      {explanation && (
        <div className="mb-3 rounded-md border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
          <div className="mb-1 font-semibold">AI suggestion (informational only)</div>
          {explanation}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {ACTIONS.map((a) => (
          <Button
            key={a.type}
            variant="secondary"
            disabled={busy}
            onClick={() => applyAction(a.type)}
          >
            {a.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => resolveReviewItem(item.id, "Ignored", "ignored")}
        >
          Ignore
        </Button>
        <Button variant="ghost" disabled={llmLoading} onClick={getExplanation}>
          {llmLoading ? "Asking AI…" : "Explain with AI"}
        </Button>
      </div>
    </Card>
  );
}
