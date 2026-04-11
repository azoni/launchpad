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
import type { DataSource, SourceType } from "../types";
import { logAudit } from "./auditLog";

const colRef = () => collection(db, COLLECTIONS.dataSources);

export function subscribeDataSources(cb: (sources: DataSource[]) => void) {
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
    metadata: input.metadata,
    createdAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTIONS.dataSources, id), source);
  await logAudit({ actionType: "source_created", targetId: id, after: source });
  return source;
}

export async function updateDataSource(id: string, patch: Partial<DataSource>) {
  await updateDoc(doc(db, COLLECTIONS.dataSources, id), patch as Record<string, unknown>);
}
