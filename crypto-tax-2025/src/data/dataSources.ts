import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, PROJECT_ID } from "../lib/collections";
import { isGuestMode } from "../lib/guestMode";
import { localSubscribe, localSet, localUpdate } from "./localStore";
import { sanitize } from "./sanitize";
import type { DataSource, SourceType } from "../types";
import { logAudit } from "./auditLog";

const COL = COLLECTIONS.dataSources;
const colRef = () => collection(db, COL);

export function subscribeDataSources(cb: (sources: DataSource[]) => void) {
  if (isGuestMode()) return localSubscribe<DataSource>(COL, cb);
  const q = query(colRef(), where("projectId", "==", PROJECT_ID));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ ...(d.data() as DataSource), id: d.id }));
    list.sort((a, b) => b.createdAt - a.createdAt);
    cb(list);
  });
}

export async function createDataSource(input: {
  type: SourceType;
  name: string;
  metadata?: Record<string, unknown>;
}): Promise<DataSource> {
  const id = crypto.randomUUID();
  const source: DataSource = {
    id,
    projectId: PROJECT_ID,
    type: input.type,
    name: input.name,
    uploadStatus: "pending",
    metadata: input.metadata ?? {},
    createdAt: Date.now(),
  };
  if (isGuestMode()) {
    localSet(COL, source);
  } else {
    await setDoc(doc(db, COL, id), sanitize(source as unknown as Record<string, unknown>));
  }
  await logAudit({ actionType: "source_created", targetId: id, after: source });
  return source;
}

export async function deleteDataSource(id: string) {
  if (isGuestMode()) {
    const { localDelete } = await import("./localStore");
    localDelete(COL, id);
  } else {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, COL, id));
  }
  await logAudit({ actionType: "source_deleted", targetId: id });
}

export async function updateDataSource(id: string, patch: Partial<DataSource>) {
  if (isGuestMode()) {
    localUpdate<DataSource>(COL, id, patch);
  } else {
    await updateDoc(doc(db, COL, id), patch as Record<string, unknown>);
  }
}
