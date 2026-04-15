import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarNav } from "./SidebarNav";
import { useAuth } from "../../hooks/useAuth";
import { useGuestMode } from "../../lib/guestMode";
import { signOut } from "../../lib/auth";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

const APP_SLUG = "crypto-tax-2025";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isGuest, exitGuest } = useGuestMode();
  const nav = useNavigate();

  // Launchpad view beacon — fires once per browser session.
  // sessionStorage dedup keeps Firestore writes minimal.
  useEffect(() => {
    const key = import.meta.env.VITE_MCP_READ_KEY;
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
      body: JSON.stringify({
        app: APP_SLUG,
        page: window.location.pathname,
      }),
    })
      .then(() => {
        try {
          sessionStorage.setItem(storageKey, "1");
        } catch {}
      })
      .catch(() => {});
  }, []);

  return (
    <div className="ledger-bg flex h-screen">
      <aside className="paper-card m-3 mr-0 flex w-64 flex-col rounded-r-none">
        <div className="border-b border-[color:var(--color-rule)] px-4 py-5">
          <div className="flex items-center gap-3">
            <img src="/icon.svg" alt="Crypto Tax 2025 ledger icon" className="h-10 w-10" />
            <div>
              <div className="font-display text-lg font-bold leading-tight text-[color:var(--color-ink)]">
                Crypto Tax
              </div>
              <div className="font-display text-sm leading-none text-[color:var(--color-ink-soft)]">
                <span className="stamp text-[10px]">2025</span>
              </div>
            </div>
          </div>
          <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-ink-faint)]">
            FIFO · Personal Reconstruction
          </div>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-[color:var(--color-rule)] p-3">
          <div className="mb-2 flex items-center gap-2 truncate text-[11px] text-[color:var(--color-ink-faint)]">
            {isGuest ? (
              <>
                <Badge tone="amber">Guest</Badge>
                <span>Browser storage only</span>
              </>
            ) : (
              user?.email
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              if (isGuest) {
                exitGuest();
                nav("/login", { replace: true });
              } else {
                signOut();
              }
            }}
          >
            {isGuest ? "Exit guest mode" : "Sign out"}
          </Button>
          <div className="mt-3 border-t border-[color:var(--color-rule)] pt-2 text-center text-[10px] text-[color:var(--color-ink-faint)]">
            Built by{" "}
            <a
              href="https://azoni.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-2"
            >
              azoni.ai
            </a>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="flex justify-end px-8 pt-3 pb-0">
          <span className="tabular rounded-sm border border-[color:var(--color-rule)] bg-[#fffaf0] px-2 py-0.5 text-[10px] text-[color:var(--color-ink-faint)]">
            v0.9.2
          </span>
        </div>
        <div className="mx-auto max-w-7xl px-8 pb-8">{children}</div>
      </main>
    </div>
  );
}
