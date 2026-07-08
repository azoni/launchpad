import Link from "next/link";

export function SiteLogo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group shrink-0" aria-label="PyroGuard home">
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <polygon points="14,2 26,24 2,24" fill="none" stroke="#ff4500" strokeWidth="2" />
        <line x1="14" y1="10" x2="14" y2="17" stroke="#ff4500" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14" cy="20" r="1.5" fill="#ff4500" />
      </svg>
      {!compact && (
        <>
          <span className="font-display text-[22px] tracking-widest3 text-white leading-none">
            PYROGUARD
          </span>
          <span className="font-display text-[22px] tracking-widest3 text-fire leading-none">AI</span>
        </>
      )}
    </Link>
  );
}
