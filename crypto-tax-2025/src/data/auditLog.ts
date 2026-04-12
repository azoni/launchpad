import {
  collection,
  doc,
  setDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { COLLECTIONS, PROJECT_ID } from "../lib/collections";
import { isGuestMode } from "../lib/guestMode";
import { localSet, localList, localSubscribe } from "./localStore";
import type { AuditLogEntry } from "../types";

const COL = COLLECTIONS.auditLog;
const colRef = () => collection(db, COL);

export async function logAudit(entry: {
  actionType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const log: AuditLogEntry = {
      id,
      projectId: PROJECT_ID,
      actionType: entry.actionType,
      targetId: entry.targetId,
      before: entry.before ?? null,
      after: entry.after ?? null,
      createdAt: Date.now(),
      createdBy: isGuestMode() ? "guest" : (auth.currentUser?.uid ?? "unknown"),
    };
    if (isGuestMode()) {
      localSet(COL, log);
    } else {
      await setDoc(doc(db, COL, id), log);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[auditLog] failed to write entry", e);
  }
}

export async function listAuditLog(): Promise<AuditLogEntry[]> {
  if (isGuestMode()) return localList<AuditLogEntry>(COL).sort((a, b) => b.createdAt - a.createdAt);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...(d.data() as AuditLogEntry), id: d.id }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function subscribeAuditLog(cb: (entries: AuditLogEntry[]) => void) {
  if (isGuestMode()) return localSubscribe<AuditLogEntry>(COL, cb);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ ...(d.data() as AuditLogEntry), id: d.id }))
      .sort((a, b) => b.createdAt - a.createdAt);
    cb(list);
  });
}
