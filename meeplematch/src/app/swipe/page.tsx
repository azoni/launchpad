"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { trackEvent } from "@/lib/analytics/posthog";
import type { OnboardingAnswers } from "@/lib/types";
import type { SwipeCardProduct } from "@/components/swipe/SwipeCard";

function getAnonymousId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("meeplematch_anon_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("meeplematch_anon_id", id);
  }
  return id;
}

export default function SwipePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"onboarding" | "swiping" | "loading">(
    "onboarding"
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialProducts, setInitialProducts] = useState<SwipeCardProduct[]>(
    []
  );

  const handleOnboardingComplete = useCallback(
    async (answers: OnboardingAnswers) => {
      setPhase("loading");
      const anonymousId = getAnonymousId();

      try {
        const sessionRes = await fetch("/api/swipe/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            anonymousId,
            onboardingAnswers: answers,
          }),
        });
        const { sessionId: sid } = await sessionRes.json();
        setSessionId(sid);

        trackEvent({
          event: "onboarding_completed",
          properties: { session_id: sid },
        });

        const recRes = await fetch(
          `/api/swipe/recommend?sessionId=${sid}&count=5`
        );
        const recData = await recRes.json();
        setInitialProducts(recData.products);
        setPhase("swiping");
      } catch (e) {
        console.error("Failed to start session:", e);
        setPhase("onboarding");
      }
    },
    []
  );

  const handleShowResults = useCallback(() => {
    if (sessionId) {
      router.push(`/results/${sessionId}`);
    }
  }, [sessionId, router]);

  if (phase === "onboarding") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="p-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-sm text-muted-foreground hover:text-foreground transition-colors">
            &larr; Home
          </Link>
          <SiteLogo size="sm" link={false} />
          <div className="w-14" />
        </header>
        <p className="text-muted-foreground font-bold text-center -mt-1 mb-2">
          Let&apos;s find your perfect game!
        </p>
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="card-cardboard w-72 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce">🎲</div>
            <p className="font-heading text-xl text-primary">
              Building your deck...
            </p>
            <p className="text-sm text-muted-foreground font-bold mt-2">
              Shuffling the good stuff
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="p-3 flex items-center justify-between shrink-0">
        <Link href="/" className="font-bold text-sm text-muted-foreground hover:text-foreground transition-colors">
          &larr; Home
        </Link>
        <SiteLogo size="sm" link={false} />
        <div className="w-14" />
      </header>
      <div className="flex-1 relative">
        <SwipeDeck
          sessionId={sessionId!}
          initialProducts={initialProducts}
          onShowResults={handleShowResults}
        />
      </div>
    </div>
  );
}
