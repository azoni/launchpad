import { adminDb } from "@/lib/firebase/admin";
import { TEMPLATE_WORKSPACE_ID } from "@/lib/firebase/collections";

const MAX_BATCH = 400;

async function copyColl(
  src: string,
  dst: string
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const snap = await adminDb.collection(src).get();
  if (snap.empty) return [];
  let batch = adminDb.batch();
  let n = 0;
  for (const doc of snap.docs) {
    batch.set(adminDb.collection(dst).doc(doc.id), doc.data());
    n++;
    if (n >= MAX_BATCH) {
      await batch.commit();
      batch = adminDb.batch();
      n = 0;
    }
  }
  if (n > 0) await batch.commit();
  return snap.docs;
}

/**
 * Clone the template workspace into a new workspace for a demo user.
 * Uses known collection paths (customers/buildings/devices/testHistory + jobs, deficiencies, reports)
 * — avoids O(n) listCollections calls that exceed Netlify's 10s default timeout.
 */
export async function cloneTemplate(dstWorkspaceId: string): Promise<void> {
  const src = `workspaces/${TEMPLATE_WORKSPACE_ID}`;
  const dst = `workspaces/${dstWorkspaceId}`;

  await adminDb.doc(dst).set({ createdAt: Date.now(), clonedFrom: TEMPLATE_WORKSPACE_ID });

  // Top-level collections (flat)
  const [customers] = await Promise.all([
    copyColl(`${src}/customers`, `${dst}/customers`),
    copyColl(`${src}/jobs`, `${dst}/jobs`),
    copyColl(`${src}/deficiencies`, `${dst}/deficiencies`),
    copyColl(`${src}/reports`, `${dst}/reports`),
    copyColl(`${src}/inspections`, `${dst}/inspections`),
  ]);

  // Per-customer: buildings
  const buildings: Array<{ customerId: string; buildingId: string }> = [];
  await Promise.all(
    customers.map(async (c) => {
      const bs = await copyColl(
        `${src}/customers/${c.id}/buildings`,
        `${dst}/customers/${c.id}/buildings`
      );
      for (const b of bs) buildings.push({ customerId: c.id, buildingId: b.id });
    })
  );

  // Per-building: devices (parallel across buildings)
  const devices: Array<{ customerId: string; buildingId: string; deviceId: string }> = [];
  await Promise.all(
    buildings.map(async ({ customerId, buildingId }) => {
      const ds = await copyColl(
        `${src}/customers/${customerId}/buildings/${buildingId}/devices`,
        `${dst}/customers/${customerId}/buildings/${buildingId}/devices`
      );
      for (const d of ds) devices.push({ customerId, buildingId, deviceId: d.id });
    })
  );

  // Per-device: testHistory — parallelize across devices (1200+ calls, but all in parallel ≈ 2-3s)
  await Promise.all(
    devices.map(({ customerId, buildingId, deviceId }) =>
      copyColl(
        `${src}/customers/${customerId}/buildings/${buildingId}/devices/${deviceId}/testHistory`,
        `${dst}/customers/${customerId}/buildings/${buildingId}/devices/${deviceId}/testHistory`
      )
    )
  );
}
