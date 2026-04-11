import { useEffect } from "react";
import { SidebarNav } from "./SidebarNav";
import { useAuth } from "../../hooks/useAuth";
import { signOut } from "../../lib/auth";
import { Button } from "../ui/Button";

const APP_SLUG = "crypto-tax-2025";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

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
          <div className="mb-2 truncate text-[11px] text-[color:var(--color-ink-faint)]">
            {user?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            Sign out
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
        <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
