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
import type { AuditLogEntry } from "../types";

const colRef = () => collection(db, COLLECTIONS.auditLog);

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
      createdBy: auth.currentUser?.uid ?? "unknown",
    };
    await setDoc(doc(db, COLLECTIONS.auditLog, id), log);
  } catch (e) {
    // Audit failures should never break the app — but log loudly.
    // eslint-disable-next-line no-console
    console.error("[auditLog] failed to write entry", e);
  }
}

export async function listAuditLog(): Promise<AuditLogEntry[]> {
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...(d.data() as AuditLogEntry), id: d.id }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function subscribeAuditLog(cb: (entries: AuditLogEntry[]) => void) {
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list = snap.docs
      .map((d) => ({ ...(d.data() as AuditLogEntry), id: d.id }))
      .sort((a, b) => b.createdAt - a.createdAt);
    cb(list);
  });
}
