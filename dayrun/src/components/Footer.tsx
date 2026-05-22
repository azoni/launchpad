import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-ink bg-card/60">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Built by{" "}
          <a
            href="https://azoni.ai"
            className="underline decoration-2 underline-offset-4 hover:text-ink"
          >
            azoni.ai
          </a>
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/about" className="hover:text-ink">About</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <a
            href="https://github.com/azoni/launchpad"
            className="hover:text-ink"
          >
            Source
          </a>
        </nav>
      </div>
    </footer>
  );
}
