import Link from "next/link";
import { APP_NAME } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="w-full border-b border-[color:var(--hairline)] bg-[color:var(--paper)]/85 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="dy-wordmark">
          {APP_NAME.toLowerCase()}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/explore"
            className="px-3 py-1.5 rounded-full text-[color:var(--ink-soft)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface)]"
          >
            Explore
          </Link>
          <Link
            href="/about"
            className="hidden sm:inline px-3 py-1.5 rounded-full text-[color:var(--ink-soft)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface)]"
          >
            About
          </Link>
          <Link href="/app" className="btn-chunky text-sm">
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}
