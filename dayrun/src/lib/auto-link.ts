import type { Firestore } from "firebase-admin/firestore";
import { COLLECTIONS, type OpportunityDoc } from "./firebase/collections";

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
}
