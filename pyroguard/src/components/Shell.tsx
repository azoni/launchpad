"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/SiteLogo";

export type ShellTab = {
  key: string;
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

export function Shell({
  tabs = [],
  watermark,
  children,
}: {
  tabs?: ShellTab[];
  watermark?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-bg text-ink flex flex-col">
      {/* Header */}
      <header className="bg-bg border-b border-border h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 safe-top">
        <div className="flex items-center gap-4 min-w-0">
          <SiteLogo href="/" />
          {watermark && (
            <span className="hidden md:inline text-fainter text-[10px] tracking-widest2">
              // {watermark}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="animate-soft-pulse text-pass text-[10px] tracking-widest2 hidden sm:inline">● LIVE</span>
        </div>
      </header>

      {/* Tab nav */}
      {tabs.length > 0 && (
        <nav className="bg-[#0a0e14] border-b border-border px-2 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((t) => {
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
      )}

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
