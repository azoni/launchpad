// Seed script — writes the _template workspace used by the Try Demo sandbox.
// Run: npm run seed.
// Requires FIREBASE_SERVICE_ACCOUNT_KEY in .env.local.

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { SEATTLE_JOBS, RECENT_REPORTS } from "../src/lib/seed-data";

const TEMPLATE = "_template";

function initAdmin() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local");
  const svc = JSON.parse(raw) as ServiceAccount;
  if (getApps().length === 0) initializeApp({ credential: cert(svc) });
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

async function deleteCollection(db: FirebaseFirestore.Firestore, path: string) {
  const snap = await db.collection(path).get();
  if (snap.empty) return;
  for (const doc of snap.docs) {
    const subs = await doc.ref.listCollections();
    for (const sub of subs) await deleteCollection(db, `${path}/${doc.id}/${sub.id}`);
    await doc.ref.delete();
  }
}

async function main() {
  const db = initAdmin();
  const base = `workspaces/${TEMPLATE}`;
  console.log(`⟳ Resetting ${base}…`);
  for (const col of ["jobs", "reports", "deficiencies", "checklistState"]) {
    await deleteCollection(db, `${base}/${col}`);
  }

  await db.doc(base).set({ createdAt: Date.now(), kind: "template" });

  const batch = db.batch();
  for (const j of SEATTLE_JOBS) {
    batch.set(db.doc(`${base}/jobs/${j.id}`), j);
  }
  for (const r of RECENT_REPORTS) {
    batch.set(db.doc(`${base}/reports/${r.id}`), { ...r, generatedAt: new Date(r.date).getTime() });
  }
  await batch.commit();

  console.log(`✓ Seeded ${SEATTLE_JOBS.length} jobs and ${RECENT_REPORTS.length} reports.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
