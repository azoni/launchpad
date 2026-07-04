import Link from "next/link";

const LINKS = [
  { href: "/", label: "Rankings" },
  { href: "/deals", label: "Deals" },
  { href: "/calculator", label: "Protein Calculator" },
  { href: "/coach", label: "AI Coach" },
  { href: "/about", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/disclosure", label: "Affiliate Disclosure" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/stats", label: "Stats" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-ink/80">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted-foreground">
          As an Amazon Associate we earn from qualifying purchases. Prices and
          availability are estimates shown for comparison and may be out of date —
          always confirm the current price on Amazon before buying. Protein and
          nutrition figures are curated from product labels and USDA FoodData
          Central. MacroMarket is for general informational purposes and is not
          medical or nutritional advice.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          © {2026} MacroMarket · Built by{" "}
          <a
            href="https://azoni.ai"
            className="font-semibold text-ink hover:text-primary"
          >
            azoni.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
