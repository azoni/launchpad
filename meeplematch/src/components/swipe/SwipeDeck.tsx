"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { SwipeCard, type SwipeCardProduct } from "./SwipeCard";
import { SwipeControls } from "./SwipeControls";
import { trackEvent } from "@/lib/analytics/posthog";

interface SwipeDeckProps {
  sessionId: string;
  initialProducts: SwipeCardProduct[];
  onShowResults: () => void;
}

const SWIPES_BEFORE_RESULTS = 15;

export function SwipeDeck({
  sessionId,
  initialProducts,
  onShowResults,
}: SwipeDeckProps) {
  const [deck, setDeck] = useState<SwipeCardProduct[]>(initialProducts);
  const [swipeCount, setSwipeCount] = useState(0);
  const [showResultsCta, setShowResultsCta] = useState(false);
  const cardStartTime = useRef(Date.now());

  const fetchMore = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/swipe/recommend?sessionId=${sessionId}&count=5`
      );
      if (!res.ok) return;
      const data = await res.json();
      setDeck((prev) => [...prev, ...data.products]);
    } catch {
      // Silently fail
    }
  }, [sessionId]);

  useEffect(() => {
    if (deck.length <= 2) {
      fetchMore();
    }
  }, [deck.length, fetchMore]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right" | "up") => {
      const product = deck[0];
      if (!product) return;

      const durationMs = Date.now() - cardStartTime.current;
      const action =
        direction === "right"
          ? "like"
          : direction === "up"
            ? "superlike"
            : "dislike";

      trackEvent({
        event: "swipe_action",
        properties: {
          session_id: sessionId,
          product_asin: product.asin,
          action,
          duration_ms: durationMs,
          card_position: swipeCount,
        },
      });

      fetch("/api/swipe/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "swipe",
          sessionId,
          productId: product.asin,
          swipeAction: action,
          durationMs,
          deckPosition: swipeCount,
          surface: "discovery",
        }),
      }).catch(() => {});

      setDeck((prev) => prev.slice(1));
      setSwipeCount((prev) => prev + 1);
      cardStartTime.current = Date.now();

      if (swipeCount + 1 >= SWIPES_BEFORE_RESULTS && !showResultsCta) {
        setShowResultsCta(true);
      }
    },
    [deck, sessionId, swipeCount, showResultsCta]
  );

  const handleDetails = useCallback(() => {
    const product = deck[0];
    if (!product) return;

    fetch("/api/swipe/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "swipe",
        sessionId,
        productId: product.asin,
        swipeAction: "details",
        durationMs: Date.now() - cardStartTime.current,
        deckPosition: swipeCount,
        surface: "discovery",
      }),
    }).catch(() => {});
  }, [deck, sessionId, swipeCount]);

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
        <div className="text-5xl">🏆</div>
        <p className="font-heading text-2xl">All swiped out!</p>
        <button
          onClick={onShowResults}
          className="btn-chunky bg-primary text-primary-foreground border-[#cc5529] px-8 py-3 text-lg shadow-[4px_4px_0px_#cc5529]"
        >
          See Your Matches!
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto w-full">
      {/* Card area — fixed height so controls stay visible */}
      <div className="relative flex-1 min-h-0">
        <AnimatePresence>
          {deck.slice(0, 2).map((product, i) => (
            <SwipeCard
              key={product.asin}
              product={product}
              isTop={i === 0}
              onSwipe={handleSwipe}
              onViewDetails={handleDetails}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Controls — always pinned at bottom */}
      <div className="shrink-0">
        <SwipeControls
          onLeft={() => handleSwipe("left")}
          onRight={() => handleSwipe("right")}
          onSuperlike={() => handleSwipe("up")}
        />

        {/* Progress bar */}
        <div className="px-6 pb-2">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (swipeCount / SWIPES_BEFORE_RESULTS) * 100)}%` }}
            />
          </div>
          <div className="text-center text-xs font-bold text-muted-foreground mt-1">
            {swipeCount < SWIPES_BEFORE_RESULTS
              ? `${SWIPES_BEFORE_RESULTS - swipeCount} more to see results`
              : "Keep going or see your matches!"}
          </div>
        </div>
      </div>

      {/* Results CTA overlay */}
      {showResultsCta && (
        <div className="absolute inset-x-0 bottom-32 flex justify-center z-20">
          <button
            onClick={onShowResults}
            className="btn-chunky bg-candy-yellow text-kraft-dark border-kraft px-6 py-3 text-base shadow-[4px_4px_0px_#8B6914] animate-bounce"
          >
            See Your Matches!
          </button>
        </div>
      )}
    </div>
  );
}
