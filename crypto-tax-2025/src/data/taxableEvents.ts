import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, PROJECT_ID } from "../lib/collections";
import type { TaxableEvent, TaxLot } from "../types";

const eventsCol = () => collection(db, COLLECTIONS.taxableEvents);
const lotsCol = () => collection(db, COLLECTIONS.taxLots);

export function subscribeTaxableEvents(cb: (events: TaxableEvent[]) => void) {
  const q = query(eventsCol(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ ...(d.data() as TaxableEvent), id: d.id }));
    list.sort((a, b) => a.dateSold - b.dateSold);
    cb(list);
  });
}

export async function listTaxableEvents(): Promise<TaxableEvent[]> {
  const q = query(eventsCol(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as TaxableEvent), id: d.id }));
}

export async function listTaxLots(): Promise<TaxLot[]> {
  const q = query(lotsCol(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as TaxLot), id: d.id }));
}

export async function replaceTaxableEvents(events: TaxableEvent[], lots: TaxLot[]) {
  // Wipe and rewrite — taxable events are derived, never user-edited.
  const existingE = await listTaxableEvents();
  const existingL = await listTaxLots();

  const wipeBatch = writeBatch(db);
  let count = 0;
  for (const e of existingE) {
    wipeBatch.delete(doc(db, COLLECTIONS.taxableEvents, e.id));
    if (++count === 400) break;
  }
  if (count > 0) await wipeBatch.commit();

  // Repeat wipes if more than 400
  let remaining = existingE.slice(count);
  while (remaining.length > 0) {
    const b = writeBatch(db);
    const slice = remaining.slice(0, 400);
    for (const e of slice) b.delete(doc(db, COLLECTIONS.taxableEvents, e.id));
    await b.commit();
    remaining = remaining.slice(400);
  }

  let lotRemaining = existingL.slice();
  while (lotRemaining.length > 0) {
    const b = writeBatch(db);
    const slice = lotRemaining.slice(0, 400);
    for (const l of slice) b.delete(doc(db, COLLECTIONS.taxLots, l.id));
    await b.commit();
    lotRemaining = lotRemaining.slice(400);
  }

  // Write new
  let toAdd = events.slice();
  while (toAdd.length > 0) {
    const b = writeBatch(db);
    const slice = toAdd.slice(0, 400);
    for (const e of slice) b.set(doc(db, COLLECTIONS.taxableEvents, e.id), e);
    await b.commit();
    toAdd = toAdd.slice(400);
  }

  let lotsToAdd = lots.slice();
  while (lotsToAdd.length > 0) {
    const b = writeBatch(db);
    const slice = lotsToAdd.slice(0, 400);
    for (const l of slice) b.set(doc(db, COLLECTIONS.taxLots, l.id), l);
    await b.commit();
    lotsToAdd = lotsToAdd.slice(400);
  }
}
