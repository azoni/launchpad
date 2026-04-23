"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const APP_SLUG = "pyroguard";

function BeaconAndAnalytics() {
  const pathname = usePathname();
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ app: APP_SLUG, page: pathname }),
    })
      .then(() => {
        try {
          sessionStorage.setItem(storageKey, "1");
        } catch {}
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BeaconAndAnalytics />
      {children}
    </>
  );
}
