import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";
import { Phone } from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border bg-card">
        <nav className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <SiteLogo size="md" />
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/services" className="nav-link hidden sm:block pb-0.5">
              Services
            </Link>
            <Link href="/about" className="nav-link hidden sm:block pb-0.5">
              About
            </Link>
            <Link
              href="/quote"
              className="btn-primary text-xs py-2 px-4"
            >
              Get a Free Quote
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-primary text-primary-foreground mt-16">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <p className="font-heading text-xl uppercase tracking-wide mb-2">
                Black Diamond Alpine Wash
              </p>
              <p className="text-sm text-primary-foreground/60">
                Professional exterior cleaning serving Whitefish and the
                Flathead Valley.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <p className="font-heading text-sm uppercase tracking-wider mb-3 text-teal">
                Quick Links
              </p>
              <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                <Link href="/services" className="hover:text-teal transition-colors">
                  Services
                </Link>
                <Link href="/quote" className="hover:text-teal transition-colors">
                  Get a Quote
                </Link>
                <Link href="/about" className="hover:text-teal transition-colors">
                  About Us
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="font-heading text-sm uppercase tracking-wider mb-3 text-teal">
                Contact
              </p>
              <div className="flex flex-col gap-2 text-sm text-primary-foreground/70">
                <a
                  href="tel:+14065551234"
                  className="flex items-center gap-2 hover:text-teal transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  (406) 555-1234
                </a>
                <a
                  href="mailto:info@blackdiamondalpinewash.com"
                  className="hover:text-teal transition-colors"
                >
                  info@blackdiamondalpinewash.com
                </a>
                <p>Whitefish, Montana</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-primary-foreground/10 flex flex-col sm:flex-row justify-between gap-2 text-xs text-primary-foreground/40">
            <p>
              &copy; {new Date().getFullYear()} Black Diamond Alpine Wash. All
              rights reserved.
            </p>
            <p>
              Built by{" "}
              <a
                href="https://azoni.ai"
                className="underline hover:text-teal"
                target="_blank"
                rel="noopener noreferrer"
              >
                azoni.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
