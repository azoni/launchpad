import type { Firestore } from "firebase-admin/firestore";
import {
  COLLECTIONS,
  type EventDoc,
  type InterviewRound,
  type OpportunityDoc,
} from "./firebase/collections";
import { parsePipelineDate, todayStartMs } from "./pipeline";

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** Token-based match: opportunity matches if every word in the company name appears in the event title.
 *  Cheap, predictable, and avoids matching "Apple" in "Pineapple". */
function matches(eventTitle: string, company: string): boolean {
  const t = normalize(eventTitle);
  const words = normalize(company).split(" ").filter(Boolean);
  if (words.length === 0) return false;
  return words.every((w) => new RegExp(`\\b${w}\\b`).test(t));
}

export type LinkPlan = { eventDocId: string; opportunityId: string };

/** Given a uid, find events that should be auto-linked to opportunities. Returns the diff to apply. */
export async function planAutoLinks(
  db: Firestore,
  uid: string,
): Promise<LinkPlan[]> {
  const oppsSnap = await db.collection(COLLECTIONS.opportunities(uid)).get();
  const opps = oppsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OpportunityDoc, "id">) }));
  if (opps.length === 0) return [];

  const eventsSnap = await db.collection(COLLECTIONS.events(uid)).get();
  const plans: LinkPlan[] = [];

  for (const ev of eventsSnap.docs) {
    const data = ev.data() as { summary?: string; opportunityId?: string | null };
    if (data.opportunityId) continue; // never overwrite a manual or prior auto-link
    if (!data.summary) continue;
    // Pick the *most specific* match (longest company name).
    const candidates = opps
      .filter((o) => matches(data.summary!, o.company))
      .sort((a, b) => b.company.length - a.company.length);
    if (candidates.length > 0) {
      plans.push({ eventDocId: ev.id, opportunityId: candidates[0].id });
    }
  }
  return plans;
}

export async function applyAutoLinks(db: Firestore, uid: string, plans: LinkPlan[]) {
  if (plans.length === 0) return;
  const batch = db.batch();
  const col = db.collection(COLLECTIONS.events(uid));
  for (const p of plans) {
    batch.update(col.doc(p.eventDocId), { opportunityId: p.opportunityId });
  }
  await batch.commit();
  await refreshOpportunityTimingFromEvents(
    db,
    uid,
    [...new Set(plans.map((p) => p.opportunityId))],
  );
}

function inferRoundTitle(summary: string, company: string, index: number): string {
  const text = normalize(summary.replace(company, " "));
  if (/\b(recruiter|intro|screen|screening|phone)\b/.test(text)) return "Recruiter screen";
  if (/\b(technical|coding|pair|code)\b/.test(text)) return "Technical round";
  if (/\b(system|design|architecture)\b/.test(text)) return "System design";
  if (/\b(behavioral|values|culture|manager|hiring)\b/.test(text)) return "Hiring manager";
  if (/\b(onsite|on site|virtual onsite|panel)\b/.test(text)) return "Onsite";
  if (/\b(final)\b/.test(text)) return "Final round";
  return `Round ${index + 1}`;
}

async function refreshOpportunityTimingFromEvents(
  db: Firestore,
  uid: string,
  opportunityIds: string[],
) {
  const floor = todayStartMs();
  for (const opportunityId of opportunityIds) {
    const oppRef = db.collection(COLLECTIONS.opportunities(uid)).doc(opportunityId);
    const oppSnap = await oppRef.get();
    if (!oppSnap.exists) continue;
    const opp = { id: oppSnap.id, ...(oppSnap.data() as Omit<OpportunityDoc, "id">) };

    const eventsSnap = await db
      .collection(COLLECTIONS.events(uid))
      .where("opportunityId", "==", opportunityId)
      .get();
    const events = eventsSnap.docs
      .map((d) => d.data() as EventDoc)
      .filter((event) => parsePipelineDate(event.start) !== null)
      .sort((a, b) => parsePipelineDate(a.start)! - parsePipelineDate(b.start)!);

    if (events.length === 0) continue;

    const firstRoundAt = events[0].start;
    const nextRoundAt =
      events.find((event) => {
        const ts = parsePipelineDate(event.start);
        return ts !== null && ts >= floor;
      })?.start ?? null;

    const update: Partial<OpportunityDoc> = {};
    if (!opp.firstRoundAt && firstRoundAt) update.firstRoundAt = firstRoundAt;
    if (!opp.nextRoundAt && nextRoundAt) update.nextRoundAt = nextRoundAt;

    if (!opp.interviewRounds || opp.interviewRounds.length === 0) {
      update.interviewRounds = events.slice(0, 12).map((event, index): InterviewRound => {
        const ts = parsePipelineDate(event.start);
        return {
          id: `event_${event.googleEventId.slice(0, 64)}`,
          eventId: event.googleEventId,
          title: inferRoundTitle(event.summary, opp.company, index),
          scheduledAt: event.start,
          outcome: ts !== null && ts < floor ? "completed" : "scheduled",
          publicNote: null,
        };
      });
    }

    if (Object.keys(update).length > 0) {
      await oppRef.update({ ...update, updatedAt: Date.now() });
    }
  }
}
