import Link from "next/link";
import { cn } from "@/lib/utils";

/** MacroMarket mark (value medallion) + serif wordmark. */
export function SiteLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="MacroMarket home"
    >
      <svg viewBox="0 0 512 512" className="h-9 w-9 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="mmLogoG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5E8449" />
            <stop offset="1" stopColor="#496A38" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="128" fill="url(#mmLogoG)" />
        <g fill="#FAF7F1">
          <rect x="118" y="222" width="30" height="68" rx="12" />
          <rect x="150" y="200" width="36" height="112" rx="15" />
          <rect x="176" y="236" width="160" height="40" rx="20" />
          <rect x="326" y="200" width="36" height="112" rx="15" />
          <rect x="364" y="222" width="30" height="68" rx="12" />
        </g>
        <rect x="232" y="242" width="48" height="28" rx="12" fill="#C26A45" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-tight text-ink">
        MacroMarket
      </span>
    </Link>
  );
}
