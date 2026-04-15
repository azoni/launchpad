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
import { localSubscribe, localList, localReplaceAll, localUpdate } from "./localStore";
import { sanitize } from "./sanitize";
import type { ReviewItem } from "../types";
import { logAudit } from "./auditLog";

const COL = COLLECTIONS.reviewItems;
const colRef = () => collection(db, COL);

export function subscribeReviewItems(cb: (items: ReviewItem[]) => void) {
  if (isGuestMode()) return localSubscribe<ReviewItem>(COL, cb);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ ...(d.data() as ReviewItem), id: d.id }));
    list.sort((a, b) => Math.abs(b.impactUsd) - Math.abs(a.impactUsd));
    cb(list);
  });
}

export async function listReviewItems(): Promise<ReviewItem[]> {
  if (isGuestMode()) return localList<ReviewItem>(COL);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as ReviewItem), id: d.id }));
}

export async function replaceReviewItems(items: ReviewItem[]) {
  if (isGuestMode()) { localReplaceAll(COL, items); return; }
  const existing = await listReviewItems();
  let toDelete = existing.slice();
  while (toDelete.length > 0) {
    const b = writeBatch(db);
    const slice = toDelete.slice(0, 400);
    for (const it of slice) b.delete(doc(db, COL, it.id));
    await b.commit();
    toDelete = toDelete.slice(400);
  }
  let toAdd = items.slice();
  while (toAdd.length > 0) {
    const b = writeBatch(db);
    const slice = toAdd.slice(0, 400);
    for (const it of slice) b.set(doc(db, COL, it.id), sanitize(it as unknown as Record<string, unknown>));
    await b.commit();
    toAdd = toAdd.slice(400);
  }
}

export async function resolveReviewItem(
  id: string,
  resolution: string,
  status: "resolved" | "ignored" = "resolved"
) {
  const patch = { status, userResolution: resolution, resolvedAt: Date.now() };
  if (isGuestMode()) {
    localUpdate<ReviewItem>(COL, id, patch);
  } else {
    await updateDoc(doc(db, COL, id), patch);
  }
  await logAudit({ actionType: "review_resolved", targetId: id, after: patch });
}
