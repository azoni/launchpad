import Link from "next/link";
import { APP_NAME } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="w-full border-b-2 border-ink bg-card/70 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            aria-hidden
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-ink bg-primary text-white shadow-[3px_3px_0_var(--color-ink)] group-hover:rotate-[-4deg] transition-transform"
          >
            {/* tiny inline icon */}
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="5.5" width="17" height="14" rx="3" />
              <path d="M3.5 10h17" />
              <path d="M8 3v4M16 3v4" />
              <circle cx="12" cy="14.5" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="font-heading text-2xl font-bold tracking-tight text-ink">
            {APP_NAME}
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/about"
            className="hidden sm:inline px-3 py-1.5 rounded-full hover:bg-muted font-semibold"
          >
            About
          </Link>
          <Link href="/app" className="btn-chunky btn-ghost text-sm">
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}
