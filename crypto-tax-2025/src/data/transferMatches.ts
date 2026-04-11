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
import type { TransferMatch } from "../types";

const colRef = () => collection(db, COLLECTIONS.transferMatches);

export function subscribeTransferMatches(cb: (matches: TransferMatch[]) => void) {
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...(d.data() as TransferMatch), id: d.id })));
  });
}

export async function listTransferMatches(): Promise<TransferMatch[]> {
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as TransferMatch), id: d.id }));
}

export async function bulkInsertTransferMatches(matches: TransferMatch[]) {
  const chunks: TransferMatch[][] = [];
  for (let i = 0; i < matches.length; i += 400) chunks.push(matches.slice(i, i + 400));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const m of chunk) batch.set(doc(db, COLLECTIONS.transferMatches, m.id), m);
    await batch.commit();
  }
}

export async function bulkDeleteTransferMatches() {
  const all = await listTransferMatches();
  const chunks: TransferMatch[][] = [];
  for (let i = 0; i < all.length; i += 400) chunks.push(all.slice(i, i + 400));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const m of chunk) batch.delete(doc(db, COLLECTIONS.transferMatches, m.id));
    await batch.commit();
  }
}
