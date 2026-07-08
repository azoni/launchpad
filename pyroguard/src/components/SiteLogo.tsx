import Link from "next/link";

export function SiteLogo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group shrink-0" aria-label="PyroGuard home">
      <svg width="27" height="27" viewBox="0 0 512 512" aria-hidden className="shrink-0">
        <path
          d="M256 60 L60 420 H452 Z"
          fill="none"
          stroke="#ff4f00"
          strokeWidth="44"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M256 180 C 256 180 196 260 196 320 C 196 355 220 380 256 380 C 292 380 316 355 316 320 C 316 260 256 180 256 180 Z"
          fill="#ff4f00"
        />
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
