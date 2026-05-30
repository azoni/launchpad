export const COLLECTIONS = {
  users: "users",
  usernames: "usernames",
  events: (uid: string) => `users/${uid}/events` as const,
  eventNotes: (uid: string) => `users/${uid}/eventNotes` as const,
  opportunities: (uid: string) => `users/${uid}/opportunities` as const,
  opportunityPrivate: (uid: string, oppId: string) =>
    `users/${uid}/opportunities/${oppId}/private` as const,
} as const;

export type UserDoc = {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  username: string | null;
  publicProfile: boolean;
  createdAt: number;
  lastSyncedAt: number | null;
};

export type EventDoc = {
  googleEventId: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  timeZone?: string | null;
  location: string | null;
  description: string | null;
  isPublic: boolean;
  syncedAt: number;
  source: "google";
  /** id of a linked Opportunity (in users/{uid}/opportunities), if any. */
  opportunityId?: string | null;
  /** User dismissed this event from the "looks like an interview" suggestions list. */
  dismissedAsInterview?: boolean;
  /** Most-common external corporate attendee domain slug (e.g. "geico") if any. Strong signal for auto-pipeline. */
  attendeeDomain?: string | null;
};

export const OPPORTUNITY_STATUSES = [
  "ongoing",
  "referral",
  "applied",
  "screen",
  "onsite",
  "awaiting",
  "offer",
  "accepted",
  "rejected",
  "withdrew",
  "ghosted",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

/** Statuses you'd plausibly pick when creating a new pipeline item.
 *  Outcomes (offer/accepted/rejected/withdrew/ghosted) only get set later
 *  on the detail page once something actually happens. */
export const INITIAL_STATUSES: OpportunityStatus[] = [
  "ongoing",
  "referral",
  "applied",
  "screen",
  "onsite",
  "awaiting",
];

export const ACTIVE_STATUSES: OpportunityStatus[] = [
  "ongoing",
  "referral",
  "applied",
  "screen",
  "onsite",
  "awaiting",
  "offer",
];

export const CLOSED_STATUSES: OpportunityStatus[] = [
  "accepted",
  "rejected",
  "withdrew",
  "ghosted",
];

export const DEFAULT_STATUS: OpportunityStatus = "ongoing";

export function normalizeOpportunityStatus(status: unknown): OpportunityStatus {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(status as string)
    ? (status as OpportunityStatus)
    : DEFAULT_STATUS;
}

export function isActive(status: unknown) {
  return ACTIVE_STATUSES.includes(normalizeOpportunityStatus(status));
}

export const LOCATION_TYPES = ["on-site", "hybrid", "remote"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const INTERVIEW_ROUND_OUTCOMES = [
  "scheduled",
  "completed",
  "passed",
  "did-not-pass",
  "cancelled",
] as const;
export type InterviewRoundOutcome = (typeof INTERVIEW_ROUND_OUTCOMES)[number];

export type InterviewRound = {
  id: string;
  roundNumber?: number | null;
  title: string;
  scheduledAt: string | null;
  outcome: InterviewRoundOutcome;
  publicNote: string | null;
  eventId?: string | null;
};

/** Public/safe fields. Notes/feedback/contacts/compensation live in the `private` subcollection. */
export type OpportunityDoc = {
  id: string;
  company: string;
  role: string;
  status: OpportunityStatus;
  source: string | null;
  link: string | null;
  nextStep: string | null;
  nextStepBy: string | null;
  firstRoundAt?: string | null;
  nextRoundAt?: string | null;
  /** Expected number of interview rounds in the process. Public, used for progress dots. */
  plannedRounds?: number | null;
  interviewRounds?: InterviewRound[];
  /** Working arrangement — visible publicly if the item is public. */
  locationType?: LocationType | null;
  /** Public-safe flag for opportunities that came through a referral. */
  hasReferral?: boolean;
  /** Public-safe signal that private checklist work is still open. Does not expose item text. */
  hasOpenActionItems?: boolean;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Contact = {
  name: string;
  role: string;
  note: string;
};

export type Brief = {
  content: string;
  generatedAt: number;
  model: string;
  contextHint: string | null;
};

/** Comp lives in the private subcollection — never publicly readable. Freeform strings so
 *  the user can write "180k base + 0.1% equity" or "$200,000–$240,000". */
export type Compensation = {
  base: string;
  equity: string;
  other: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

/** Private subcollection doc: `users/{uid}/opportunities/{oppId}/private/data`. */
export type OpportunityPrivateDoc = {
  notes: string;
  feedback: string;
  contacts: Contact[];
  brief?: Brief | null;
  compensation?: Compensation | null;
  checklist?: ChecklistItem[];
};

export const ROUND_OUTCOMES = ["pending", "passed", "failed", "no-show"] as const;
export type RoundOutcome = (typeof ROUND_OUTCOMES)[number];

/** Owner-private per-event metadata. Lives at users/{uid}/eventNotes/{eventDocId}. */
export type EventNotesDoc = {
  roundName: string | null;
  outcome: RoundOutcome;
  notes: string;
  updatedAt: number;
};
