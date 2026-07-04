import Link from "next/link";
import { SiteLogo } from "./SiteLogo";

const NAV = [
  { href: "/", label: "Rankings" },
  { href: "/deals", label: "Deals" },
  { href: "/calculator", label: "Calculator" },
  { href: "/coach", label: "AI Coach" },
  { href: "/about", label: "How it works" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <SiteLogo className="shrink-0" />
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto text-sm font-semibold [scrollbar-width:none] sm:gap-1 [&::-webkit-scrollbar]:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-md px-2.5 py-2 text-ink/80 transition-colors hover:bg-secondary hover:text-ink sm:px-3"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
