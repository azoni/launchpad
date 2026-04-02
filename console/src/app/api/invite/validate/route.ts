import { getDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export async function POST(request: Request) {
  const { code } = await request.json();
  if (!code) {
    return Response.json({ valid: false, error: "Code required" }, { status: 400 });
  }

  const snap = await getDb()
    .collection(COLLECTIONS.INVITES)
    .where("code", "==", code)
    .limit(1)
    .get();

  if (snap.empty) {
    return Response.json({ valid: false, error: "Invalid code" }, { status: 401 });
  }

  const invite = snap.docs[0].data();
  if (invite.maxUses > 0 && invite.useCount >= invite.maxUses) {
    return Response.json({ valid: false, error: "Code expired" }, { status: 401 });
  }

  return Response.json({ valid: true });
}
