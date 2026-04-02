import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { initializeWeights } from "@/lib/recommend/attributes";
import { FieldValue } from "firebase-admin/firestore";
import type { OnboardingAnswers, SwipeAction } from "@/lib/types";

/** POST /api/swipe/session — Create a new session or log a swipe event. */
export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body as { action: string };

  if (action === "create") {
    return createSession(body);
  }

  if (action === "swipe") {
    return logSwipe(body);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function createSession(body: {
  anonymousId: string;
  onboardingAnswers: OnboardingAnswers;
}) {
  const { anonymousId, onboardingAnswers } = body;

  const sessionRef = adminDb.collection(COLLECTIONS.sessions).doc();
  const sessionId = sessionRef.id;
  const now = FieldValue.serverTimestamp();

  await sessionRef.set({
    anonymousId,
    email: null,
    onboardingAnswers,
    createdAt: now,
    updatedAt: now,
  });

  // Create initial profile
  const weights = initializeWeights(onboardingAnswers);
  await adminDb
    .collection(COLLECTIONS.sessionProfiles)
    .doc(sessionId)
    .set({
      sessionId,
      category: "board-games",
      attributeWeights: weights,
      likedAsins: [],
      dislikedAsins: [],
      swipeCount: 0,
      updatedAt: now,
    });

  return NextResponse.json({ sessionId });
}

async function logSwipe(body: {
  sessionId: string;
  productId: string;
  swipeAction: SwipeAction;
  durationMs: number;
  deckPosition: number;
  surface: string;
}) {
  const { sessionId, productId, swipeAction, durationMs, deckPosition, surface } =
    body;

  // Log raw event
  const eventsPath = COLLECTIONS.swipeEvents(sessionId);
  await adminDb.collection(eventsPath).add({
    productId,
    action: swipeAction,
    durationMs,
    deckPosition,
    surface,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Update profile if it's a scoreable action
  if (
    swipeAction === "like" ||
    swipeAction === "dislike" ||
    swipeAction === "superlike" ||
    swipeAction === "skip"
  ) {
    // Fetch product and current profile
    const [productSnap, profileSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.products).doc(productId).get(),
      adminDb.collection(COLLECTIONS.sessionProfiles).doc(sessionId).get(),
    ]);

    if (productSnap.exists && profileSnap.exists) {
      const { updateProfile } = await import("@/lib/recommend/engine");
      const product = productSnap.data()!;
      const profile = profileSnap.data()!;

      const updated = updateProfile(
        profile as Parameters<typeof updateProfile>[0],
        product as Parameters<typeof updateProfile>[1],
        swipeAction
      );

      await adminDb
        .collection(COLLECTIONS.sessionProfiles)
        .doc(sessionId)
        .update({
          attributeWeights: updated.attributeWeights,
          likedAsins: updated.likedAsins,
          dislikedAsins: updated.dislikedAsins,
          swipeCount: updated.swipeCount,
          updatedAt: FieldValue.serverTimestamp(),
        });
    }
  }

  return NextResponse.json({ ok: true });
}
