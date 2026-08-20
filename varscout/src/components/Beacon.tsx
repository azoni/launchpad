"use client";

import { useEffect } from "react";
import { APP_SLUG } from "@/lib/site";

/**
 * Launchpad view beacon — one fire per browser session, deduplicated through
 * sessionStorage. Deliberately not wired to pathname changes: that would burn
 * Firestore quota for no extra signal.
 */
export function Beacon() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MCP_READ_KEY;
    if (!key) return;
    const storageKey = `lp_view_${APP_SLUG}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {
      return;
    }
    fetch("https://azoni-mcp.onrender.com/launchpad/view", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ app: APP_SLUG, page: window.location.pathname }),
    })
      .then(() => {
        try {
          sessionStorage.setItem(storageKey, "1");
        } catch {}
      })
      .catch(() => {});
  }, []);

  return null;
}
