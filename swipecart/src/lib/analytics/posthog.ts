"use client";

import posthog from "posthog-js";
import type { AnalyticsEvent } from "./events";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key) return;

  posthog.init(key, {
    api_host: host ?? "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
  });

  initialized = true;
}

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  posthog.capture(event.event, event.properties);
}

export function identifyUser(anonymousId: string) {
  if (typeof window === "undefined") return;
  posthog.identify(anonymousId);
}
