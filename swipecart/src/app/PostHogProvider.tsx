"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initPostHog } from "@/lib/analytics/posthog";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog();
  }, []);

  // Launchpad view beacon — tracks page views for the portfolio dashboard
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MCP_READ_KEY;
    if (!key) return;

    fetch("https://azoni-mcp.onrender.com/launchpad/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ app: "swipecart", page: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return <>{children}</>;
}
