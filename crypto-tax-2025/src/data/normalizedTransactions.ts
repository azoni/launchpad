import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, PROJECT_ID } from "../lib/collections";
import { isGuestMode } from "../lib/guestMode";
import { localSubscribe, localList, localBulkSet, localReplaceAll, localUpdate } from "./localStore";
import type { NormalizedTransaction, ReviewStatus, TxType } from "../types";
import { logAudit } from "./auditLog";

const COL = COLLECTIONS.normalizedTransactions;
const colRef = () => collection(db, COL);

export function subscribeNormalized(cb: (txs: NormalizedTransaction[]) => void) {
  if (isGuestMode()) return localSubscribe<NormalizedTransaction>(COL, cb);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ ...(d.data() as NormalizedTransaction), id: d.id }));
    list.sort((a, b) => a.timestamp - b.timestamp);
    cb(list);
  });
}

export async function listNormalized(): Promise<NormalizedTransaction[]> {
  if (isGuestMode()) return localList<NormalizedTransaction>(COL).sort((a, b) => a.timestamp - b.timestamp);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...(d.data() as NormalizedTransaction), id: d.id }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function bulkInsertNormalized(txs: NormalizedTransaction[]) {
  if (isGuestMode()) { localReplaceAll(COL, txs); return; }
  const chunks: NormalizedTransaction[][] = [];
  for (let i = 0; i < txs.length; i += 400) chunks.push(txs.slice(i, i + 400));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const t of chunk) batch.set(doc(db, COL, t.id), t);
    await batch.commit();
  }
}

export async function bulkDeleteNormalized() {
  if (isGuestMode()) { localReplaceAll(COL, []); return; }
  const all = await listNormalized();
  const chunks: NormalizedTransaction[][] = [];
  for (let i = 0; i < all.length; i += 400) chunks.push(all.slice(i, i + 400));
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const t of chunk) batch.delete(doc(db, COL, t.id));
    await batch.commit();
  }
}

export async function patchNormalized(
  id: string,
  patch: Partial<Pick<NormalizedTransaction, "txType" | "reviewStatus" | "notes" | "usdValue">> & {
    txType?: TxType;
    reviewStatus?: ReviewStatus;
  }
) {
  if (isGuestMode()) {
    localUpdate<NormalizedTransaction>(COL, id, patch);
  } else {
    await updateDoc(doc(db, COL, id), patch as Record<string, unknown>);
  }
  await logAudit({ actionType: "tx_patched", targetId: id, after: patch });
}
