import Link from "next/link";

export function SiteLogo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group shrink-0" aria-label="PyroGuard home">
      <span className="relative inline-flex items-center justify-center w-7 h-7 rounded-md bg-fire/15 border border-fire/30">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path
            d="M8 1.5c.6 1.8 2.6 2.6 2.6 5 0 1.4-.9 2.6-2.2 2.6-.6 0-1.2-.4-1.2-1.1 0-.5.4-.8.4-1.6 0-.7-.5-1.3-.5-1.3-1.4 1.6-2.5 3-2.5 4.7 0 2.3 1.8 4.2 4.1 4.2s4.1-1.9 4.1-4.2C12.8 6.4 10.4 4.6 8 1.5z"
            fill="#dc2626"
          />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-[20px] font-semibold tracking-tight text-ink leading-none">
          PyroGuard
        </span>
      )}
    </Link>
  );
}
