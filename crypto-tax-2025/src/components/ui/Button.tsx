import { classNames } from "../../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[color:var(--color-ink)] text-[color:var(--color-paper)] border border-[color:var(--color-ink)] hover:bg-[color:var(--color-ink-soft)]",
  secondary:
    "bg-[#fffaf0] text-[color:var(--color-ink)] border border-[color:var(--color-rule)] hover:bg-[color:var(--color-paper)]",
  ghost:
    "text-[color:var(--color-ink-soft)] hover:bg-[color:var(--color-paper-deep)]",
  danger:
    "bg-[color:var(--color-stamp)] text-[color:var(--color-paper)] border border-[color:var(--color-stamp)] hover:bg-red-700",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={classNames(
        "lift inline-flex items-center justify-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium tracking-wide disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
