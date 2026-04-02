import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b-3 border-kraft bg-[#FFF8ED]">
        <nav className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <SiteLogo size="md" />
          <div className="flex items-center gap-4 text-sm font-bold">
            <Link
              href="/board-games"
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              Games
            </Link>
            <Link
              href="/swipe"
              className="btn-chunky bg-primary text-primary-foreground border-[#cc5529] px-5 py-2 text-sm shadow-[3px_3px_0px_#cc5529]"
            >
              Start Swiping!
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t-3 border-kraft bg-secondary/50 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p className="font-heading text-xl text-foreground">SwipeCart</p>
              <p className="font-bold">Find products you love, faster.</p>
            </div>
            <div className="flex gap-6 font-bold">
              <Link href="/board-games" className="hover:text-foreground">
                Board Games
              </Link>
              <Link href="/swipe" className="hover:text-primary">
                Start Swiping
              </Link>
            </div>
          </div>
          <div className="mt-4 text-xs opacity-70 flex flex-col sm:flex-row justify-between gap-2">
            <p>
              SwipeCart is a participant in the Amazon Associates Program. As an
              Amazon Associate, we earn from qualifying purchases.
            </p>
            <p>
              Built by{" "}
              <a href="https://azoni.ai" className="underline hover:opacity-100" target="_blank" rel="noopener noreferrer">
                azoni.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
