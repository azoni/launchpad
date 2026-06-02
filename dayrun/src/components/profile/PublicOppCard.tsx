import { CheckSquare, ChevronRight, Handshake } from "lucide-react";
import type { Compensation, OpportunityDoc, OpportunityStatus } from "@/lib/firebase/collections";
import { StatusPill } from "@/components/pipeline/StatusPill";
import { RoundProgressDots } from "@/components/pipeline/RoundProgressDots";
import {
  compactRoundNumberLabel,
  daysSinceLastContact,
  formatPipelineDate,
  formatPipelineDateLong,
  getCurrentRound,
  getFirstRoundAt,
  getLastRoundAt,
  getNextRoundAt,
  getPlannedRoundCount,
  isClosedOpportunity,
  nextStepLabel,
  visibleRounds,
} from "@/lib/pipeline";

export type PublicOpportunity = OpportunityDoc & {
  publicCompensation?: Compensation | null;
};

export const NEGATIVE_CLOSED: OpportunityStatus[] = ["rejected", "withdrew", "ghosted"];

/** Awaiting items quieter than this many days get a gentle (not alarming) nudge. */
const STALE_DAYS = 14;

export function PublicOppCard({
  opp,
  muted,
  tone,
}: {
  opp: PublicOpportunity;
  muted?: boolean;
  tone?: "positive" | "negative";
}) {
  const isStruck = NEGATIVE_CLOSED.includes(opp.status);
  const isClosed = isClosedOpportunity(opp);
  const firstRoundAt = getFirstRoundAt(opp);
  const nextRoundAt = getNextRoundAt(opp);
  const lastRoundAt = getLastRoundAt(opp);
  const currentRound = getCurrentRound(opp);
  const nextLabel = nextStepLabel(opp);
  const focusDate = isClosed ? lastRoundAt : nextRoundAt;
  const plannedRoundCount = getPlannedRoundCount(opp);
  const rounds = visibleRounds(opp, 5);
  const comp = opp.publicCompensation;
  const compParts = [
    comp?.base ? `${comp.base} base` : null,
    comp?.equity ? `${comp.equity} eq` : null,
    comp?.other || null,
  ].filter(Boolean) as string[];
  const hasComp = compParts.length > 0;
  const hasInfoChips = !!opp.locationType || hasComp;
  const hasOpenActionItems = opp.hasOpenActionItems === true && !isClosed;
  const hasReferral = opp.hasReferral === true || opp.status === "referral";
  const showStatusPill = !(hasReferral && opp.status === "referral");
  const awaitingFeedback = !isClosed && opp.status === "awaiting" && !nextRoundAt;
  const waitingToSchedule = !isClosed && opp.status === "ongoing" && !nextRoundAt;
  const daysQuiet = awaitingFeedback ? daysSinceLastContact(opp) : null;

  // Compact meta line: progress dots · N-round process · first/last date.
  const metaDateLabel = isClosed
    ? lastRoundAt
      ? `last ${formatPipelineDate(lastRoundAt, "")}`
      : null
    : firstRoundAt
      ? `first ${formatPipelineDate(firstRoundAt, "")}`
      : null;

  const focusEyebrow = isClosed
    ? "closed with"
    : hasOpenActionItems
      ? "blocked"
      : awaitingFeedback
        ? "awaiting"
        : waitingToSchedule
          ? "to schedule"
          : "focus next";
  const focusTitle = hasOpenActionItems
    ? "Action item open"
    : nextLabel ??
      (isClosed
        ? "Process closed"
        : awaitingFeedback
          ? "Waiting on feedback"
          : waitingToSchedule
            ? "Waiting to schedule"
            : "Next step TBD");
  const topBorderColor =
    hasOpenActionItems
      ? "var(--primary)"
      : tone === "positive" || opp.status === "accepted"
      ? "var(--positive)"
      : tone === "negative" || opp.status === "rejected"
        ? "var(--negative)"
        : opp.status === "withdrew" || opp.status === "ghosted"
          ? "var(--hairline-strong)"
          : "var(--positive)";

  return (
    <article
      className={`chunky p-5 ${muted ? "opacity-70" : ""}`}
      style={{ boxShadow: `inset 0 2px 0 0 ${topBorderColor}` }}
    >
      <header className="flex items-start justify-between gap-2 flex-wrap mb-2">
        <div className="min-w-0">
          <h3
            className={`text-[18px] font-medium leading-tight tracking-tight ${
              isStruck ? "line-through text-[color:var(--faded)]" : ""
            }`}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {opp.company}
          </h3>
          <p className="text-[13.5px] text-[color:var(--ink-soft)] mt-0.5">{opp.role}</p>
        </div>
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {hasReferral && (
            <span className="dy-pill dy-pill-outline">
              <Handshake size={12} />
              referral
            </span>
          )}
          {hasOpenActionItems && (
            <span className="dy-pill dy-pill-accent">
              <CheckSquare size={12} />
              action needed
            </span>
          )}
          {showStatusPill && <StatusPill status={opp.status} />}
        </div>
      </header>

      <div className="mb-3 flex items-center gap-x-2 gap-y-1 flex-wrap text-[12px] text-[color:var(--faded)]">
        <RoundProgressDots opp={opp} />
        <span>{plannedRoundCount}-round process</span>
        {metaDateLabel && (
          <>
            <span aria-hidden>·</span>
            <span>{metaDateLabel}</span>
          </>
        )}
      </div>

      {hasInfoChips && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {opp.locationType && (
            <span className="dy-pill dy-pill-neutral">{opp.locationType}</span>
          )}
          {hasComp && (
            <span className="dy-pill dy-pill-neutral">comp · {compParts.join(" · ")}</span>
          )}
        </div>
      )}

      {(hasOpenActionItems || firstRoundAt || nextRoundAt || nextLabel || rounds.length > 0) && (
        <div
          className="mt-4 rounded-md border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-2"
          style={{ boxShadow: isClosed ? undefined : "inset 2px 0 0 0 var(--primary)" }}
        >
          <p className="dy-eyebrow">{focusEyebrow}</p>
          <p className="text-[13px] font-medium text-[color:var(--ink)] mt-1">{focusTitle}</p>
          {awaitingFeedback && daysQuiet !== null ? (
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span
                className={`dy-pill ${daysQuiet > STALE_DAYS ? "dy-pill-outline" : "dy-pill-neutral"}`}
              >
                awaiting · {daysQuiet}d{daysQuiet > STALE_DAYS ? " — quiet a while" : ""}
              </span>
              {lastRoundAt && (
                <span className="dy-mono text-[color:var(--faded)]">
                  last {formatPipelineDate(lastRoundAt, "")}
                </span>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-[color:var(--faded)] mt-0.5">
              {formatPipelineDateLong(focusDate, isClosed ? "no final date" : "no date")}
              {!isClosed && currentRound?.outcome ? ` - ${currentRound.outcome}` : ""}
            </p>
          )}
        </div>
      )}

      {rounds.length > 0 && (
        <details className="mt-4 group" open={rounds.length <= 2 && !isClosed}>
          <summary className="list-none cursor-pointer inline-flex items-center gap-1 dy-mono text-[color:var(--faded)] hover:text-[color:var(--ink-soft)]">
            <ChevronRight size={12} className="transition-transform group-open:rotate-90" />
            {rounds.length} {rounds.length === 1 ? "round" : "rounds"}
          </summary>
          <ol className="mt-3 space-y-2">
            {rounds.map((round, index) => (
              <li key={round.id} className="flex items-start gap-2 text-[13px]">
                <span
                  className="mt-[7px] h-1.5 w-1.5 rounded-full shrink-0"
                  style={{
                    background:
                      round.outcome === "passed"
                        ? "var(--positive)"
                        : round.outcome === "did-not-pass" || round.outcome === "cancelled"
                          ? "var(--faded)"
                          : "var(--primary)",
                  }}
                />
                <div className="min-w-0">
                  <p className="text-[color:var(--ink)] leading-snug">
                    <span className="text-[color:var(--faded)]">
                      {compactRoundNumberLabel(round, index + 1)} -{" "}
                      {formatPipelineDate(round.scheduledAt, "TBD")}
                    </span>{" "}
                    {round.title}
                    <span className="text-[color:var(--faded)]"> · {round.outcome}</span>
                  </p>
                  {round.publicNote && (
                    <p className="text-[color:var(--ink-soft)] leading-snug mt-0.5">
                      {round.publicNote}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </details>
      )}

      {(opp.source || opp.link) && (
        <p className="dy-mono text-[color:var(--faded)] mt-2">
          {opp.source && <span>via {opp.source}</span>}
          {opp.source && opp.link && " · "}
          {opp.link && (
            <a
              href={opp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[color:var(--hairline-strong)] underline-offset-2 hover:decoration-[color:var(--primary)]"
            >
              posting
            </a>
          )}
        </p>
      )}
    </article>
  );
}
