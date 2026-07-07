import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/80 backdrop-blur-md safe-top">
        <div className="container flex h-14 items-center justify-between">
          <SiteLogo />
          <nav className="flex items-center gap-1 sm:gap-1">
            <Link
              href="/discovery"
              className="hidden sm:inline-flex items-center text-[12px] text-muted hover:text-ink transition-colors px-3 py-2 rounded-md hover:bg-surface/60"
            >
              Discovery
            </Link>
            <Link
              href="/standards"
              className="hidden sm:inline-flex items-center text-[12px] text-muted hover:text-ink transition-colors px-3 py-2 rounded-md hover:bg-surface/60"
            >
              Standards
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:inline-flex items-center text-[12px] text-muted hover:text-ink transition-colors px-3 py-2 rounded-md hover:bg-surface/60"
            >
              Pricing
            </Link>
            <Link
              href="/app"
              className="ml-2 bg-fire hover:bg-fire2 text-white px-4 py-2 rounded-md text-[12px] font-medium transition-colors shadow-glow"
            >
              Open Demo
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-bg mt-12">
        <div className="container py-12 text-[12px] text-muted">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="space-y-4">
              <SiteLogo />
              <p className="text-[12px] max-w-xs leading-relaxed text-faint">
                The follow-up layer for fire protection contractors.
                Deficiencies, quotes, and customer outreach &mdash; without replacing your existing systems.
              </p>
            </div>
            <div className="space-y-2">
              <div className="eyebrow mb-3">Product</div>
              <Link className="block hover:text-ink transition-colors" href="/app">
                Demo Dashboard
              </Link>
              <Link className="block hover:text-ink transition-colors" href="/discovery">
                Discovery Form
              </Link>
              <Link className="block hover:text-ink transition-colors" href="/pricing">
                Pricing
              </Link>
              <Link className="block hover:text-ink transition-colors" href="/standards">
                NFPA Coverage
              </Link>
            </div>
            <div className="space-y-2">
              <div className="eyebrow mb-3">Company</div>
              <a className="block hover:text-ink transition-colors" href="mailto:hello@pyroguard.app">
                Contact
              </a>
              <Link className="block hover:text-ink transition-colors" href="/standards">
                Disclaimers
              </Link>
            </div>
            <div className="space-y-2">
              <div className="eyebrow mb-3">Notes</div>
              <p className="text-[11px] leading-relaxed text-faint">
                Demo data only. PyroGuard supports but does not replace the judgment of a
                NICET-certified inspector. Verify all citations against the current NFPA edition.
              </p>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-[11px] text-faint">
            <div>&copy; {new Date().getFullYear()} PyroGuard</div>
            <div>
              Built by{" "}
              <a
                href="https://azoni.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink transition-colors"
              >
                azoni.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
