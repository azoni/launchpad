import { cn } from "@/lib/utils";
import { STATUS_COLOR, STATUS_LABEL, type DeficiencyStatus } from "@/lib/deficiencies";

/**
 * The deficiency workflow-status pill (Needs quote / Scheduled / …). Extracted from the
 * inline `style={{ background, color, boxShadow }}` block that was copy-pasted across the
 * deficiencies list, deficiency detail, and dashboard.
 */
export function StatusPill({
  status,
  className,
}: {
  status: DeficiencyStatus;
  className?: string;
}) {
  const sc = STATUS_COLOR[status];
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-1 rounded-md text-[10.5px] tracking-wide font-medium whitespace-nowrap",
        className
      )}
      style={{ background: sc.bg, color: sc.text, boxShadow: `inset 0 0 0 1px ${sc.ring}` }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
