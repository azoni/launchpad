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
import { localSubscribe, localList, localReplaceAll } from "./localStore";
import { sanitize } from "./sanitize";
import type { TransferMatch } from "../types";

const COL = COLLECTIONS.transferMatches;
const colRef = () => collection(db, COL);

export function subscribeTransferMatches(cb: (matches: TransferMatch[]) => void) {
  if (isGuestMode()) return localSubscribe<TransferMatch>(COL, cb);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as TransferMatch), id: d.id })));
  });
}

export async function listTransferMatches(): Promise<TransferMatch[]> {
  if (isGuestMode()) return localList<TransferMatch>(COL);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as TransferMatch), id: d.id }));
}

export async function bulkInsertTransferMatches(matches: TransferMatch[]) {
  if (isGuestMode()) { localReplaceAll(COL, matches); return; }
  const chunks: TransferMatch[][] = [];
  for (let i = 0; i < matches.length; i += 400) chunks.push(matches.slice(i, i + 400));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const m of chunk) batch.set(doc(db, COL, m.id), sanitize(m as unknown as Record<string, unknown>));
    await batch.commit();
  }
}

export async function bulkDeleteTransferMatches() {
  if (isGuestMode()) { localReplaceAll(COL, []); return; }
  const all = await listTransferMatches();
  const chunks: TransferMatch[][] = [];
  for (let i = 0; i < all.length; i += 400) chunks.push(all.slice(i, i + 400));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const m of chunk) batch.delete(doc(db, COL, m.id));
    await batch.commit();
  }
}
