import Link from "next/link";
import { ProteinCounter } from "./ProteinCounter";
import { SiteLogo } from "./SiteLogo";

const NAV = [
  { href: "/", label: "Rankings" },
  { href: "/deals", label: "Deals" },
  { href: "/best", label: "Best of" },
  { href: "/price-index", label: "Price Index" },
  { href: "/calculator", label: "Calculator" },
  { href: "/coach", label: "AI Coach" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <SiteLogo className="shrink-0" />
        <div className="flex min-w-0 items-center gap-3">
          <ProteinCounter />
          <nav className="-mr-2 flex min-w-0 items-center gap-1 overflow-x-auto pr-2 text-sm font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center whitespace-nowrap rounded-lg px-3 py-2.5 text-ink/80 transition-colors hover:bg-secondary hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
