import Link from "next/link";

export function SiteLogo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group shrink-0" aria-label="PyroGuard home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-badge.png" alt="" width={28} height={28} className="rounded-md shrink-0" />
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
