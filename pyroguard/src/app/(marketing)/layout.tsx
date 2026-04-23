import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/95 backdrop-blur-md safe-top">
        <div className="container flex h-14 items-center justify-between">
          <SiteLogo />
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/standards"
              className="hidden sm:inline text-[11px] tracking-widest2 uppercase text-faint hover:text-ink transition-colors px-2 py-2"
            >
              Standards
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:inline text-[11px] tracking-widest2 uppercase text-faint hover:text-ink transition-colors px-2 py-2"
            >
              Pricing
            </Link>
            <Link
              href="/app"
              className="bg-fire hover:bg-fire3 text-white px-4 py-2 rounded text-[11px] tracking-widest2 uppercase transition-colors"
            >
              Launch Demo →
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-bg mt-16">
        <div className="container py-10 text-[11px] text-muted tracking-wide">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <SiteLogo />
              <p className="text-[10px] max-w-xs leading-relaxed text-faint">
                AI-augmented fire/life-safety inspection platform for contractors who prefer to fix
                things instead of fight paperwork.
              </p>
            </div>
            <div className="space-y-2">
              <div className="tactical-label">Product</div>
              <Link className="block hover:text-ink" href="/pricing">
                Pricing
              </Link>
              <Link className="block hover:text-ink" href="/standards">
                NFPA Coverage
              </Link>
              <Link className="block hover:text-ink" href="/app">
                Launch Demo
              </Link>
            </div>
            <div className="space-y-2">
              <div className="tactical-label">Company</div>
              <a className="block hover:text-ink" href="mailto:hello@pyroguard.app">
                Contact
              </a>
              <Link className="block hover:text-ink" href="/standards">
                Disclaimers
              </Link>
            </div>
            <div className="space-y-2">
              <div className="tactical-label">Legal</div>
              <p className="text-[10px] leading-relaxed">
                PyroGuard supports but does not replace the judgment of a NICET-certified inspector.
                Verify all citations against current NFPA standards.
              </p>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3 text-[10px]">
            <div>© {new Date().getFullYear()} PYROGUARD AI</div>
            <div>
              Built by{" "}
              <a
                href="https://azoni.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink"
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
