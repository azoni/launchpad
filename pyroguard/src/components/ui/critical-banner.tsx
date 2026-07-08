import { AlertTriangle } from "lucide-react";

/**
 * One consistent, unmissable top-of-page critical treatment — replaces the buried dot on
 * critical deficiency tickets and gives the inspect/job screen the severity emphasis it
 * currently lacks entirely.
 */
export function CriticalBanner({
  title,
  detail,
  className = "",
}: {
  title: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border border-alarm/30 bg-alarm/10 px-4 py-3 ${className}`}
      role="region"
      aria-label="Critical warning"
    >
      <AlertTriangle className="h-4 w-4 text-fire3 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-fire3">{title}</div>
        {detail && <div className="text-[12px] text-muted mt-0.5 leading-relaxed">{detail}</div>}
      </div>
    </div>
  );
}
