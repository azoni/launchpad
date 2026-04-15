import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, PROJECT_ID } from "../lib/collections";
import { sanitize } from "./sanitize";
import { isGuestMode } from "../lib/guestMode";
import { localBulkSet, localList, localReplaceAll } from "./localStore";
import type { RawTransaction } from "../types";

const COL = COLLECTIONS.rawTransactions;

export async function bulkInsertRaw(
  sourceId: string,
  rows: Array<Record<string, unknown>>
): Promise<RawTransaction[]> {
  const out: RawTransaction[] = rows.map((row) => ({
    id: crypto.randomUUID(),
    projectId: PROJECT_ID,
    sourceId,
    rawPayload: row,
    importedAt: Date.now(),
  }));

  if (isGuestMode()) {
    localBulkSet(COL, out);
    return out;
  }

  const chunks: RawTransaction[][] = [];
  for (let i = 0; i < out.length; i += 400) chunks.push(out.slice(i, i + 400));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const raw of chunk) batch.set(doc(db, COL, raw.id), sanitize(raw as unknown as Record<string, unknown>));
    await batch.commit();
  }
  return out;
}

export async function listRawForSource(sourceId: string): Promise<RawTransaction[]> {
  if (isGuestMode()) return localList<RawTransaction>(COL).filter((r) => r.sourceId === sourceId);
  const q = query(collection(db, COL), where("projectId", "==", PROJECT_ID), where("sourceId", "==", sourceId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as RawTransaction), id: d.id }));
}

export async function listAllRaw(): Promise<RawTransaction[]> {
  if (isGuestMode()) return localList<RawTransaction>(COL);
  const q = query(collection(db, COL), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as RawTransaction), id: d.id }));
}

export async function deleteAllRaw(): Promise<void> {
  if (isGuestMode()) {
    localReplaceAll(COL, []);
    return;
  }
  const all = await listAllRaw();
  let toDelete = all.slice();
  while (toDelete.length > 0) {
    const batch = writeBatch(db);
    const slice = toDelete.slice(0, 400);
    for (const r of slice) batch.delete(doc(db, COL, r.id));
    await batch.commit();
    toDelete = toDelete.slice(400);
  }
}

export async function deleteRawForSource(sourceId: string): Promise<void> {
  if (isGuestMode()) {
    const all = localList<RawTransaction>(COL);
    localReplaceAll(COL, all.filter((r) => r.sourceId !== sourceId));
    return;
  }
  const rows = await listRawForSource(sourceId);
  let toDelete = rows.slice();
  while (toDelete.length > 0) {
    const batch = writeBatch(db);
    const slice = toDelete.slice(0, 400);
    for (const r of slice) batch.delete(doc(db, COL, r.id));
    await batch.commit();
    toDelete = toDelete.slice(400);
  }
}
