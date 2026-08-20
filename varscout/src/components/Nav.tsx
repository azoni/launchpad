import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function Nav() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-6xl items-baseline gap-6 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-baseline gap-2.5 no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.svg"
            alt={`${SITE_NAME} logo — a rising bar over a ledger rule`}
            width={22}
            height={22}
            className="translate-y-[3px]"
          />
          <span className="font-serif text-[1.35rem] leading-none tracking-tight text-ink">
            {SITE_NAME}
          </span>
        </Link>
        <nav className="ml-auto flex items-baseline gap-5 text-[0.82rem]">
          <Link href="/" className="text-ink-2 no-underline hover:text-rust">
            Screener
          </Link>
          <Link href="/markets" className="text-ink-2 no-underline hover:text-rust">
            Markets
          </Link>
          <Link href="/method" className="text-ink-2 no-underline hover:text-rust">
            Method
          </Link>
        </nav>
      </div>
    </header>
  );
}
