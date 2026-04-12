import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, PROJECT_ID } from "../lib/collections";
import { isGuestMode } from "../lib/guestMode";
import { localList, localSet } from "./localStore";
import type { Project } from "../types";

export async function ensureProject(ownerUid: string): Promise<Project> {
  if (isGuestMode()) {
    const existing = localList<Project>(COLLECTIONS.projects);
    if (existing.length > 0) return existing[0];
    const project: Project = {
      id: PROJECT_ID,
      name: "2025 Crypto Taxes",
      taxYear: 2025,
      basisMethod: "fifo",
      ownerUid: "guest",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    localSet(COLLECTIONS.projects, project);
    return project;
  }

  const ref = doc(db, COLLECTIONS.projects, PROJECT_ID);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data() as Project;
    return { ...data, id: PROJECT_ID };
  }

  const now = Date.now();
  const project: Project = {
    id: PROJECT_ID,
    name: "2025 Crypto Taxes",
    taxYear: 2025,
    basisMethod: "fifo",
    ownerUid,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, { ...project, _serverCreatedAt: serverTimestamp() });
  return project;
}
