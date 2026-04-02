import { getDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const doc = await getDb().collection(COLLECTIONS.BUILDS).doc(id).get();
  if (!doc.exists) {
    return Response.json({ error: "Build not found" }, { status: 404 });
  }

  const data = doc.data()!;
  return Response.json({
    id: doc.id,
    prompt: data.prompt,
    slug: data.slug,
    status: data.status,
    netlifyUrl: data.netlifyUrl,
    error: data.error,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
    startedAt: data.startedAt?.toDate?.()?.toISOString() ?? null,
    completedAt: data.completedAt?.toDate?.()?.toISOString() ?? null,
  });
}
