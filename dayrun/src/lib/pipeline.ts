import type { InterviewRound, OpportunityDoc, OpportunityStatus } from "./firebase/collections";

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
  const ts = parsePipelineDate(trimmed);
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatPipelineDate(value?: string | null, fallback = "No date"): string {
  const ts = parsePipelineDate(value);
  if (!ts) return fallback;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatPipelineDateLong(value?: string | null, fallback = "No date"): string {
  const ts = parsePipelineDate(value);
  if (!ts) return fallback;
  return new Date(ts).toLocaleDateString([], {
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

const STATUS_RANK: Record<OpportunityStatus, number> = {
  offer: 0,
  onsite: 1,
  screen: 2,
  applied: 3,
  referral: 4,
  ongoing: 5,
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
  if ((STATUS_RANK[a.status] ?? 99) !== (STATUS_RANK[b.status] ?? 99)) {
    return (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
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
      return a.title.localeCompare(b.title);
    });
  return typeof limit === "number" ? rounds.slice(0, limit) : rounds;
}

export function nextStepLabel(opp: OpportunityDoc): string | null {
  const round = getCurrentRound(opp);
  if (round) return round.title;
  return opp.nextStep ?? null;
}
