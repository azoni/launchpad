"use client";

import { useEffect } from "react";

/**
 * Counts a food-page view once per browser session per item (sessionStorage
 * dedup keeps Firestore writes low). Renders nothing.
 */
export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `mm_view_${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      return;
    }
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);
  return null;
}
