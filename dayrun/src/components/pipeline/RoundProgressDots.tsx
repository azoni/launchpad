import type { OpportunityDoc } from "@/lib/firebase/collections";
import { getRoundProgress } from "@/lib/pipeline";

export function RoundProgressDots({
  opp,
  compact,
}: {
  opp: OpportunityDoc;
  compact?: boolean;
}) {
  const progress = getRoundProgress(opp);
  return (
    <div
      className="inline-flex items-center gap-1"
      title={`${progress.filled} of ${progress.total} rounds`}
      aria-label={`${progress.filled} of ${progress.total} rounds`}
    >
      {Array.from({ length: progress.total }, (_, index) => {
        const number = index + 1;
        const isFilled = number <= progress.filled;
        const isTerminal = progress.terminalIndex === number;
        const bg =
          isTerminal && progress.terminalTone === "negative"
            ? "var(--negative)"
            : isFilled
              ? "var(--positive)"
              : "transparent";
        return (
          <span
            key={number}
            className={`${compact ? "h-2 w-2" : "h-2.5 w-2.5"} rounded-full border`}
            style={{
              background: bg,
              borderColor: isFilled ? bg : "var(--hairline-strong)",
            }}
          />
        );
      })}
    </div>
  );
}
