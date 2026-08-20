import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 sm:px-8">
      <p className="eyebrow">Error 404</p>
      <h1 className="mt-3 font-serif text-[2.6rem] leading-tight tracking-tight">
        No such page on the sheet.
      </h1>
      <p className="mt-5 text-[1rem] leading-relaxed text-ink-2">
        If you were looking for a market, it may have been delisted from Variational Omni, or the
        ticker may be spelled differently. The directory has every market currently trading.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-6 text-[0.9rem]">
        <Link href="/" className="border-b border-rust pb-0.5 text-rust no-underline hover:border-ink hover:text-ink">
          Back to the screener →
        </Link>
        <Link href="/markets" className="text-ink-2 no-underline hover:text-rust">
          All markets
        </Link>
        <Link href="/method" className="text-ink-2 no-underline hover:text-rust">
          Method
        </Link>
      </div>
    </div>
  );
}
