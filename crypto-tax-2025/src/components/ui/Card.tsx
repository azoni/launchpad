import { classNames } from "../../lib/format";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={classNames("paper-card p-5", className)}>{children}</div>;
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4 border-b border-[color:var(--color-rule)] pb-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-ink-soft)]">
          {title}
        </div>
        {subtitle && (
          <div className="mt-0.5 text-xs text-[color:var(--color-ink-faint)]">{subtitle}</div>
        )}
      </div>
      {right}
    </div>
  );
}
