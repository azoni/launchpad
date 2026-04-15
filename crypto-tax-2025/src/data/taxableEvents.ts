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
import { isGuestMode } from "../lib/guestMode";
import { sanitize } from "./sanitize";
import { localSubscribe, localList, localReplaceAll } from "./localStore";
import type { TaxableEvent, TaxLot } from "../types";

const EVENTS = COLLECTIONS.taxableEvents;
const LOTS = COLLECTIONS.taxLots;
const eventsCol = () => collection(db, EVENTS);
const lotsCol = () => collection(db, LOTS);

export function subscribeTaxableEvents(cb: (events: TaxableEvent[]) => void) {
  if (isGuestMode()) return localSubscribe<TaxableEvent>(EVENTS, cb);
  const q = query(eventsCol(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ ...(d.data() as TaxableEvent), id: d.id }));
    list.sort((a, b) => a.dateSold - b.dateSold);
    cb(list);
  });
}

export async function listTaxableEvents(): Promise<TaxableEvent[]> {
  if (isGuestMode()) return localList<TaxableEvent>(EVENTS);
  const q = query(eventsCol(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as TaxableEvent), id: d.id }));
}

export async function listTaxLots(): Promise<TaxLot[]> {
  if (isGuestMode()) return localList<TaxLot>(LOTS);
  const q = query(lotsCol(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as TaxLot), id: d.id }));
}

export async function replaceTaxableEvents(events: TaxableEvent[], lots: TaxLot[]) {
  if (isGuestMode()) {
    localReplaceAll(EVENTS, events);
    localReplaceAll(LOTS, lots);
    return;
  }

  // Firestore: wipe and rewrite
  const existingE = await listTaxableEvents();
  const existingL = await listTaxLots();

  for (const batch of chunkDelete(existingE, EVENTS)) await batch();
  for (const batch of chunkDelete(existingL, LOTS)) await batch();
  for (const batch of chunkSet(events, EVENTS)) await batch();
  for (const batch of chunkSet(lots, LOTS)) await batch();
}

function chunkDelete<T extends { id: string }>(items: T[], col: string) {
  const ops: Array<() => Promise<void>> = [];
  for (let i = 0; i < items.length; i += 400) {
    const slice = items.slice(i, i + 400);
    ops.push(async () => {
      const b = writeBatch(db);
      for (const it of slice) b.delete(doc(db, col, it.id));
      await b.commit();
    });
  }
  return ops;
}

function chunkSet<T extends { id: string }>(items: T[], col: string) {
  const ops: Array<() => Promise<void>> = [];
  for (let i = 0; i < items.length; i += 400) {
    const slice = items.slice(i, i + 400);
    ops.push(async () => {
      const b = writeBatch(db);
      for (const it of slice) b.set(doc(db, col, it.id), sanitize(it as unknown as Record<string, unknown>));
      await b.commit();
    });
  }
  return ops;
}
