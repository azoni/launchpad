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
      title={progress.label}
      aria-label={progress.label}
    >
      {progress.dots.map((dot) => {
        const bg =
          dot.tone === "passed"
            ? "var(--positive)"
            : dot.tone === "current"
              ? "#D8A431"
              : dot.tone === "failed"
                ? "var(--negative)"
                : "#FFFDF6";
        return (
          <span
            key={dot.number}
            className={`${compact ? "h-2 w-2" : "h-2.5 w-2.5"} rounded-full border`}
            style={{
              background: bg,
              borderColor: dot.tone === "empty" ? "var(--hairline-strong)" : bg,
            }}
          />
        );
      })}
    </div>
  );
}
