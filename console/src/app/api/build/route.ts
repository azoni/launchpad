import { getDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { triggerBuildWorkflow } from "@/lib/github";
import { FieldValue } from "firebase-admin/firestore";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export async function POST(request: Request) {
  const { prompt, inviteCode } = await request.json();

  if (!prompt || !inviteCode) {
    return Response.json(
      { error: "Prompt and invite code required" },
      { status: 400 }
    );
  }

  // Validate invite code
  const inviteSnap = await getDb()
    .collection(COLLECTIONS.INVITES)
    .where("code", "==", inviteCode)
    .limit(1)
    .get();

  if (inviteSnap.empty) {
    return Response.json({ error: "Invalid invite code" }, { status: 401 });
  }

  const inviteDoc = inviteSnap.docs[0];
  const invite = inviteDoc.data();

  if (invite.maxUses > 0 && invite.useCount >= invite.maxUses) {
    return Response.json({ error: "Invite code expired" }, { status: 401 });
  }

  // Rate limit: max 3 builds per day per code
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayBuilds = await getDb()
    .collection(COLLECTIONS.BUILDS)
    .where("inviteCode", "==", inviteCode)
    .where("createdAt", ">=", today)
    .get();

  if (todayBuilds.size >= 3) {
    return Response.json(
      { error: "Daily build limit reached (3/day)" },
      { status: 429 }
    );
  }

  // Check for concurrent builds
  const activeBuilds = await getDb()
    .collection(COLLECTIONS.BUILDS)
    .where("status", "in", ["queued", "building"])
    .get();

  if (!activeBuilds.empty) {
    return Response.json(
      { error: "A build is already in progress. Please wait." },
      { status: 429 }
    );
  }

  const slug = slugify(prompt);

  // Create build document
  const buildRef = getDb().collection(COLLECTIONS.BUILDS).doc();
  await buildRef.set({
    prompt,
    slug,
    inviteCode,
    status: "queued",
    netlifyUrl: null,
    error: null,
    createdAt: FieldValue.serverTimestamp(),
    startedAt: null,
    completedAt: null,
  });

  // Trigger GitHub Actions workflow
  try {
    await triggerBuildWorkflow(prompt, buildRef.id, slug);
  } catch (err) {
    await buildRef.update({
      status: "failed",
      error: `Failed to trigger build: ${err instanceof Error ? err.message : String(err)}`,
    });
    return Response.json({ error: "Failed to trigger build" }, { status: 500 });
  }

  // Increment invite use count
  await inviteDoc.ref.update({ useCount: FieldValue.increment(1) });

  return Response.json({ buildId: buildRef.id, slug });
}
