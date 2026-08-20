import Link from "next/link";
import { OMNI_URL, SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <p className="max-w-2xl text-[0.8rem] leading-relaxed text-muted">
          {SITE_NAME} is a research tool, not advice and not a broker. It reads the public
          market-statistics endpoint published by{" "}
          <a href={OMNI_URL} className="text-ink-2 underline decoration-rule-2 underline-offset-2 hover:text-rust">
            Variational Omni
          </a>{" "}
          and ranks what it finds. Collecting funding on a perpetual is an unhedged directional
          position: the carry is contractual, the price risk is not. Sizing, timing and execution are
          yours. Figures update live and will differ by the time you act on them.
        </p>
        <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[0.78rem] text-muted">
          <Link href="/method" className="no-underline hover:text-rust">
            Method
          </Link>
          <Link href="/markets" className="no-underline hover:text-rust">
            All markets
          </Link>
          <a href="/llms.txt" className="no-underline hover:text-rust">
            llms.txt
          </a>
          <span className="ml-auto">
            Built by{" "}
            <a href="https://azoni.ai" className="underline decoration-rule-2 underline-offset-2 hover:text-rust">
              azoni.ai
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
