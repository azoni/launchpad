import {
  CLOSED_STATUSES,
  normalizeOpportunityStatus,
  type InterviewRound,
  type OpportunityDoc,
  type OpportunityStatus,
} from "./firebase/collections";
import { calendarParts, formatCalendarDay } from "./calendar-time";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parsePipelineDate(value?: string | null): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (DATE_ONLY_RE.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (DATE_ONLY_RE.test(trimmed)) return trimmed;
  const parts = calendarParts(trimmed);
  if (!parts) return "";
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatPipelineDate(value?: string | null, fallback = "No date"): string {
  if (!value || !calendarParts(value)) return fallback;
  return formatCalendarDay(value, { month: "short", day: "numeric" });
}

export function formatPipelineDateLong(value?: string | null, fallback = "No date"): string {
  if (!value || !calendarParts(value)) return fallback;
  return formatCalendarDay(value, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function todayStartMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isOpenRound(round: InterviewRound): boolean {
  return round.outcome === "scheduled" || round.outcome === "completed";
}

export function isClosedOpportunity(opp: OpportunityDoc): boolean {
  return CLOSED_STATUSES.includes(normalizeOpportunityStatus(opp.status));
}

export function getRoundNumber(
  round?: InterviewRound | null,
  fallback?: number,
): number | null {
  const raw = round?.roundNumber ?? fallback ?? null;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const value = Math.trunc(raw);
  return value > 0 ? value : null;
}

export function roundNumberLabel(
  round?: InterviewRound | null,
  fallback?: number,
): string | null {
  const number = getRoundNumber(round, fallback);
  return number === null ? null : `Round ${number}`;
}

export function compactRoundNumberLabel(
  round?: InterviewRound | null,
  fallback?: number,
): string | null {
  const number = getRoundNumber(round, fallback);
  return number === null ? null : `R${number}`;
}

export function roundTitleWithNumber(
  round?: InterviewRound | null,
  fallback?: number,
): string | null {
  if (!round) return null;
  const label = roundNumberLabel(round, fallback);
  const title = round.title.trim();
  if (!label) return title || null;
  if (!title || title.toLowerCase() === label.toLowerCase()) return label;
  return `${label}: ${title}`;
}

export function getFirstRoundAt(opp: OpportunityDoc): string | null {
  if (opp.firstRoundAt) return opp.firstRoundAt;
  const dated = (opp.interviewRounds ?? [])
    .filter((r) => parsePipelineDate(r.scheduledAt) !== null)
    .sort((a, b) => parsePipelineDate(a.scheduledAt)! - parsePipelineDate(b.scheduledAt)!);
  return dated[0]?.scheduledAt ?? null;
}

export function getNextRoundAt(opp: OpportunityDoc): string | null {
  const floor = todayStartMs();
  const round = (opp.interviewRounds ?? [])
    .filter((r) => isOpenRound(r))
    .filter((r) => {
      const ts = parsePipelineDate(r.scheduledAt);
      return ts !== null && ts >= floor;
    })
    .sort((a, b) => parsePipelineDate(a.scheduledAt)! - parsePipelineDate(b.scheduledAt)!)[0];
  if (round?.scheduledAt) return round.scheduledAt;

  const explicit = parsePipelineDate(opp.nextRoundAt);
  if (explicit !== null && explicit >= floor) return opp.nextRoundAt ?? null;
  return opp.nextRoundAt ?? null;
}

export function getCurrentRound(opp: OpportunityDoc): InterviewRound | null {
  const nextAt = getNextRoundAt(opp);
  if (!nextAt) return null;
  const nextTs = parsePipelineDate(nextAt);
  if (nextTs === null) return null;
  return (
    (opp.interviewRounds ?? []).find((round) => {
      const roundTs = parsePipelineDate(round.scheduledAt);
      return roundTs !== null && roundTs === nextTs && isOpenRound(round);
    }) ?? null
  );
}

export function getLastRound(opp: OpportunityDoc): InterviewRound | null {
  const rounds = visibleRounds(opp);
  if (rounds.length === 0) return null;
  const dated = rounds
    .filter((round) => parsePipelineDate(round.scheduledAt) !== null)
    .sort((a, b) => parsePipelineDate(b.scheduledAt)! - parsePipelineDate(a.scheduledAt)!);
  return dated[0] ?? rounds[rounds.length - 1] ?? null;
}

export function getLastRoundAt(opp: OpportunityDoc): string | null {
  return getLastRound(opp)?.scheduledAt ?? opp.nextRoundAt ?? opp.firstRoundAt ?? null;
}

export type RoundProgress = {
  total: number;
  passed: number;
  currentIndex: number | null;
  failedIndex: number | null;
  dots: RoundProgressDot[];
  label: string;
};

export type RoundProgressDot = {
  number: number;
  tone: "passed" | "current" | "failed" | "empty";
};

function clampRoundCount(value: unknown, fallback: number): number {
  const raw =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : fallback;
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(12, Math.max(1, Math.trunc(raw)));
}

export function getPlannedRoundCount(opp: OpportunityDoc): number {
  const rounds = visibleRounds(opp);
  const highestRoundNumber = rounds.reduce(
    (max, round, index) => Math.max(max, getRoundNumber(round, index + 1) ?? 0),
    0,
  );
  return clampRoundCount(opp.plannedRounds, Math.max(highestRoundNumber, rounds.length, 1));
}

export function getRoundProgress(opp: OpportunityDoc): RoundProgress {
  const plannedTotal = getPlannedRoundCount(opp);
  const status = normalizeOpportunityStatus(opp.status);
  const rounds = visibleRounds(opp);
  const floor = todayStartMs();
  const roundNumbers = rounds.map((round, index) => getRoundNumber(round, index + 1) ?? index + 1);
  const highestKnown = Math.max(0, ...roundNumbers);
  const nextRound = rounds.find((round) => {
    const ts = parsePipelineDate(round.scheduledAt);
    return ts !== null && ts >= floor && isOpenRound(round);
  });
  const nextIndex = nextRound
    ? (getRoundNumber(nextRound, rounds.findIndex((round) => round.id === nextRound.id) + 1) ?? null)
    : null;
  const activeCurrentIndex = nextIndex ?? (highestKnown > 0 ? highestKnown : null);
  const isRejected = status === "rejected";
  const isNegativeClosed = status === "rejected" || status === "withdrew" || status === "ghosted";
  const failedIndex = isRejected ? Math.max(1, activeCurrentIndex ?? highestKnown ?? 1) : null;
  const currentIndex =
    !isNegativeClosed && status !== "accepted" && status !== "offer"
      ? activeCurrentIndex
      : null;
  const total = Math.max(plannedTotal, currentIndex ?? 0, failedIndex ?? 0);
  const explicitPassed = new Set<number>();

  for (const [index, round] of rounds.entries()) {
    const number = getRoundNumber(round, index + 1) ?? index + 1;
    if (round.outcome === "passed") explicitPassed.add(number);
  }

  const terminalIndex = failedIndex ?? currentIndex;
  const successTerminal = status === "accepted" || status === "offer";
  const successThrough = successTerminal ? highestKnown : 0;
  const dots: RoundProgressDot[] = Array.from({ length: total }, (_, index) => {
    const number = index + 1;
    if (failedIndex === number) return { number, tone: "failed" };
    if (currentIndex === number) return { number, tone: "current" };
    if (
      explicitPassed.has(number) ||
      (terminalIndex !== null && number < terminalIndex) ||
      (successThrough > 0 && number <= successThrough)
    ) {
      return { number, tone: "passed" };
    }
    return { number, tone: "empty" };
  });

  const passed = dots.filter((dot) => dot.tone === "passed").length;
  const currentState =
    currentIndex && nextIndex
      ? `, round ${currentIndex} scheduled`
      : currentIndex && status === "ongoing"
        ? `, round ${currentIndex} ongoing`
        : currentIndex
          ? `, round ${currentIndex} awaiting`
          : "";
  const failed = failedIndex ? `, rejected at round ${failedIndex}` : "";
  return {
    total,
    passed,
    currentIndex,
    failedIndex,
    dots,
    label: `${passed} passed${currentState}${failed}, ${total} expected`,
  };
}

const STATUS_RANK: Record<OpportunityStatus, number> = {
  offer: 0,
  awaiting: 1,
  onsite: 2,
  screen: 3,
  applied: 4,
  referral: 5,
  ongoing: 6,
  accepted: 10,
  rejected: 11,
  withdrew: 12,
  ghosted: 13,
};

export function compareOpportunitiesByNext(a: OpportunityDoc, b: OpportunityDoc): number {
  const aDate = parsePipelineDate(getNextRoundAt(a));
  const bDate = parsePipelineDate(getNextRoundAt(b));
  const aFuture = aDate !== null && aDate >= todayStartMs();
  const bFuture = bDate !== null && bDate >= todayStartMs();
  if (aFuture !== bFuture) return aFuture ? -1 : 1;
  if (aFuture && bFuture && aDate !== bDate) return aDate - bDate;
  const aStatus = normalizeOpportunityStatus(a.status);
  const bStatus = normalizeOpportunityStatus(b.status);
  if ((STATUS_RANK[aStatus] ?? 99) !== (STATUS_RANK[bStatus] ?? 99)) {
    return (STATUS_RANK[aStatus] ?? 99) - (STATUS_RANK[bStatus] ?? 99);
  }
  return b.updatedAt - a.updatedAt;
}

export function visibleRounds(opp: OpportunityDoc, limit?: number): InterviewRound[] {
  const rounds = [...(opp.interviewRounds ?? [])]
    .filter((r) => r.title.trim() || r.scheduledAt)
    .sort((a, b) => {
      const aDate = parsePipelineDate(a.scheduledAt);
      const bDate = parsePipelineDate(b.scheduledAt);
      if (aDate !== null && bDate !== null && aDate !== bDate) return aDate - bDate;
      if (aDate !== null) return -1;
      if (bDate !== null) return 1;
      const aRoundNumber = getRoundNumber(a);
      const bRoundNumber = getRoundNumber(b);
      if (aRoundNumber !== null && bRoundNumber !== null && aRoundNumber !== bRoundNumber) {
        return aRoundNumber - bRoundNumber;
      }
      if (aRoundNumber !== null) return -1;
      if (bRoundNumber !== null) return 1;
      return a.title.localeCompare(b.title);
    });
  return typeof limit === "number" ? rounds.slice(0, limit) : rounds;
}

export function nextStepLabel(opp: OpportunityDoc): string | null {
  const round = getCurrentRound(opp);
  if (round) return roundTitleWithNumber(round);
  return opp.nextStep ?? null;
}
