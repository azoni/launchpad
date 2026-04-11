import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../lib/firebase";
import { PROJECT_ID } from "../lib/collections";

// Optional Firebase Storage backup of the original CSV.
// Returns the storage path on success, or null if Storage isn't available
// (e.g. project is on the Spark/free plan and bucket creation needs Blaze).
// This is non-critical: the audit trail is preserved by rawTransactions in
// Firestore, which holds every parsed row.
export async function uploadCsv(sourceId: string, file: File): Promise<string | null> {
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
