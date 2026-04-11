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
import type { ReviewItem } from "../types";
import { logAudit } from "./auditLog";

const colRef = () => collection(db, COLLECTIONS.reviewItems);

export function subscribeReviewItems(cb: (items: ReviewItem[]) => void) {
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ ...(d.data() as ReviewItem), id: d.id }));
    list.sort((a, b) => Math.abs(b.impactUsd) - Math.abs(a.impactUsd));
    cb(list);
  });
}

export async function listReviewItems(): Promise<ReviewItem[]> {
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as ReviewItem), id: d.id }));
}

export async function replaceReviewItems(items: ReviewItem[]) {
  const existing = await listReviewItems();
  // Wipe in chunks
  let toDelete = existing.slice();
  while (toDelete.length > 0) {
    const b = writeBatch(db);
    const slice = toDelete.slice(0, 400);
    for (const it of slice) b.delete(doc(db, COLLECTIONS.reviewItems, it.id));
    await b.commit();
    toDelete = toDelete.slice(400);
  }
  // Insert in chunks
  let toAdd = items.slice();
  while (toAdd.length > 0) {
    const b = writeBatch(db);
    const slice = toAdd.slice(0, 400);
    for (const it of slice) b.set(doc(db, COLLECTIONS.reviewItems, it.id), it);
    await b.commit();
    toAdd = toAdd.slice(400);
  }
}

export async function resolveReviewItem(
  id: string,
  resolution: string,
  status: "resolved" | "ignored" = "resolved"
) {
  const patch = {
    status,
    userResolution: resolution,
    resolvedAt: Date.now(),
  };
  await updateDoc(doc(db, COLLECTIONS.reviewItems, id), patch);
  await logAudit({ actionType: "review_resolved", targetId: id, after: patch });
}
