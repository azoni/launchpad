import { SiteLogo } from "@/components/SiteLogo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-bg/95 backdrop-blur-md safe-top">
        <div className="container flex h-14 items-center justify-between">
          <SiteLogo />
          <span className="animate-soft-pulse text-warn text-[10px] tracking-widest2 uppercase">
            ● V2 In Development
          </span>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-bg mt-16">
        <div className="container py-10 text-[11px] text-muted tracking-wide">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <SiteLogo />
              <p className="text-[10px] max-w-xs leading-relaxed text-faint">
                The all-in-one operations platform for fire/life-safety inspection contractors —
                schedule, inspect, file, quote, and invoice in one system.
              </p>
            </div>
            <div className="space-y-2">
              <div className="tactical-label">Company</div>
              <a className="block hover:text-ink" href="mailto:charltonuw@gmail.com?subject=PyroGuard">
                Contact
              </a>
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
