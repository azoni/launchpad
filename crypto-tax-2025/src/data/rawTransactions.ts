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
import type { RawTransaction } from "../types";

export async function bulkInsertRaw(
  sourceId: string,
  rows: Array<Record<string, unknown>>
): Promise<RawTransaction[]> {
  const out: RawTransaction[] = [];
  // Firestore batches max 500 ops; chunk to be safe.
  const chunks: Array<typeof rows> = [];
  for (let i = 0; i < rows.length; i += 400) chunks.push(rows.slice(i, i + 400));

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const row of chunk) {
      const id = crypto.randomUUID();
      const raw: RawTransaction = {
        id,
        projectId: PROJECT_ID,
        sourceId,
        rawPayload: row,
        importedAt: Date.now(),
      };
      batch.set(doc(db, COLLECTIONS.rawTransactions, id), raw);
      out.push(raw);
    }
    await batch.commit();
  }
  return out;
}

export async function listRawForSource(sourceId: string): Promise<RawTransaction[]> {
  const q = query(
    collection(db, COLLECTIONS.rawTransactions),
    where("projectId", "==", PROJECT_ID),
    where("sourceId", "==", sourceId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as RawTransaction), id: d.id }));
}

export async function listAllRaw(): Promise<RawTransaction[]> {
  const q = query(
    collection(db, COLLECTIONS.rawTransactions),
    where("projectId", "==", PROJECT_ID)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as RawTransaction), id: d.id }));
}
