"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspaceId } from "@/lib/auth";
import { SiteLogo } from "@/components/SiteLogo";
import { LayoutDashboard, AlertTriangle, Mail, ClipboardCheck, FileText } from "lucide-react";

const TABS = [
  { key: "dashboard", href: "/app", label: "Dashboard", icon: LayoutDashboard, match: (p: string) => p === "/app" },
  { key: "deficiencies", href: "/app/deficiencies", label: "Deficiencies", icon: AlertTriangle, match: (p: string) => p.startsWith("/app/deficiencies") },
  { key: "follow-ups", href: "/app/follow-ups", label: "Follow-Ups", icon: Mail, match: (p: string) => p.startsWith("/app/follow-ups") },
  { key: "inspect", href: "/app/inspect", label: "Inspect", icon: ClipboardCheck, match: (p: string) => p.startsWith("/app/inspect") },
  { key: "reports", href: "/app/reports", label: "Reports", icon: FileText, match: (p: string) => p.startsWith("/app/reports") },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const wsId = useWorkspaceId();
  const initial = wsId ? wsId.slice(0, 1).toUpperCase() : "D";

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      <header className="bg-bg/80 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 safe-top sticky top-0 z-30">
        <div className="flex items-center gap-5 min-w-0">
          <SiteLogo href="/app" />
          <span className="hidden md:inline text-[11px] text-faint tracking-wide pl-5 border-l border-border">
            Demo workspace &middot; Seattle
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-pass">
            <span className="w-1.5 h-1.5 rounded-full bg-pass animate-soft-pulse" />
            Live
          </span>
          <button
            onClick={() => {
              if (confirm("Reset your sandbox? Clears this browser's workspace data.")) {
                localStorage.removeItem("pyroguard_workspace_id");
                localStorage.removeItem("pyroguard-workspace");
                router.push("/app");
                setTimeout(() => window.location.reload(), 50);
              }
            }}
            className="w-8 h-8 rounded-full bg-fire/90 hover:bg-fire flex items-center justify-center text-[12px] font-semibold text-white transition-colors"
            aria-label="Reset workspace"
          >
            {initial}
          </button>
        </div>
      </header>

      <nav className="bg-surface/40 backdrop-blur-sm border-b border-border px-2 sm:px-6 flex gap-px overflow-x-auto no-scrollbar shrink-0 sticky top-14 z-20">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={`px-3 sm:px-4 py-3 text-[12.5px] shrink-0 transition-colors inline-flex items-center gap-2 border-b-2 ${
                active
                  ? "text-ink border-fire font-medium"
                  : "text-muted hover:text-ink border-transparent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </Link>
          );
        })}
      </nav>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
