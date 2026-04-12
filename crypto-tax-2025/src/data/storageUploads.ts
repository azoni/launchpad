import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../lib/firebase";
import { PROJECT_ID } from "../lib/collections";
import { isGuestMode } from "../lib/guestMode";

export async function uploadCsv(sourceId: string, file: File): Promise<string | null> {
  // Guest mode: no Firebase Storage. CSV is parsed in-memory and rows go
  // into localStorage via rawTransactions. No backup needed.
  if (isGuestMode()) return null;

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  const path = `users/${uid}/projects/${PROJECT_ID}/sources/${sourceId}/${file.name}`;
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    await getDownloadURL(storageRef);
    return path;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[uploadCsv] Storage backup skipped:", e);
    return null;
  }
}
