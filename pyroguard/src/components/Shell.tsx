"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspaceId } from "@/lib/auth";
import { SiteLogo } from "@/components/SiteLogo";

const TABS = [
  { key: "dashboard", href: "/app", label: "⬛ Dashboard", match: (p: string) => p === "/app" },
  { key: "routes", href: "/app/routes", label: "◈ Routes", match: (p: string) => p.startsWith("/app/routes") },
  { key: "inspect", href: "/app/inspect", label: "✓ Inspect", match: (p: string) => p.startsWith("/app/inspect") },
  { key: "assistant", href: "/app/assistant", label: "◉ AI Assistant", match: (p: string) => p.startsWith("/app/assistant") },
  { key: "reports", href: "/app/reports", label: "⎘ Reports", match: (p: string) => p.startsWith("/app/reports") },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const wsId = useWorkspaceId();
  const initial = wsId ? wsId.slice(0, 1).toUpperCase() : "J";

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      {/* Header */}
      <header className="bg-bg border-b border-border h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 safe-top">
        <div className="flex items-center gap-4 min-w-0">
          <SiteLogo href="/app" />
          <span className="hidden md:inline text-fainter text-[10px] tracking-widest2">
            // SEATTLE FIRE INSPECTION PLATFORM
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="animate-soft-pulse text-pass text-[10px] tracking-widest2 hidden sm:inline">● LIVE</span>
          <button
            onClick={() => {
              if (confirm("Reset your sandbox? Clears this browser's workspace data.")) {
                localStorage.removeItem("pyroguard_workspace_id");
                localStorage.removeItem("pyroguard-workspace");
                router.push("/app");
                setTimeout(() => window.location.reload(), 50);
              }
            }}
            className="w-8 h-8 rounded-full bg-fire flex items-center justify-center text-[12px] font-bold text-white"
            aria-label="Reset workspace"
          >
            {initial}
          </button>
        </div>
      </header>

      {/* Tab nav */}
      <nav className="bg-[#0a0e14] border-b border-border px-2 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar shrink-0">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`px-3 sm:px-[18px] py-2.5 text-[11px] tracking-widest2 uppercase shrink-0 transition-colors ${
                active
                  ? "text-fire border-b-2 border-fire"
                  : "text-faint hover:text-ink border-b-2 border-transparent"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
