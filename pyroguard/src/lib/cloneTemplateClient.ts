"use client";
import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { TEMPLATE_WORKSPACE_ID } from "@/lib/firebase/collections";

const MAX_BATCH = 400;

async function copyColl(src: string, dst: string): Promise<number> {
  const snap = await getDocs(collection(db, src));
  if (snap.empty) return 0;
  let batch = writeBatch(db);
  let n = 0;
  for (const d of snap.docs) {
    batch.set(doc(db, dst, d.id), d.data());
    n++;
    if (n >= MAX_BATCH) {
      await batch.commit();
      batch = writeBatch(db);
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
  return snap.size;
}

export async function cloneTemplateInBrowser(
  dstWorkspaceId: string,
  onProgress?: (pct: number, label: string) => void
): Promise<void> {
  const src = `workspaces/${TEMPLATE_WORKSPACE_ID}`;
  const dst = `workspaces/${dstWorkspaceId}`;

  onProgress?.(10, "Creating workspace…");
  await setDoc(doc(db, "workspaces", dstWorkspaceId), {
    createdAt: Date.now(),
    clonedFrom: TEMPLATE_WORKSPACE_ID,
  });

  onProgress?.(35, "Copying jobs and reports…");
  await Promise.all([
    copyColl(`${src}/jobs`, `${dst}/jobs`),
    copyColl(`${src}/reports`, `${dst}/reports`),
    copyColl(`${src}/deficiencies`, `${dst}/deficiencies`),
  ]);

  onProgress?.(100, "Ready");
}
