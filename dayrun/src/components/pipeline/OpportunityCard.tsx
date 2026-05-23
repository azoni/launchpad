import Link from "next/link";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import type { OpportunityDoc } from "@/lib/firebase/collections";
import { StatusPill } from "./StatusPill";

export function OpportunityCard({
  opp,
  href,
  showVisibility = true,
}: {
  opp: OpportunityDoc;
  href: string;
  showVisibility?: boolean;
}) {
  return (
    <Link
      href={href}
      className="block chunky p-4 md:p-5 hover:no-underline tilt-hover"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="min-w-0">
          <p className="font-heading text-xl md:text-2xl font-bold leading-tight">
            {opp.company}
          </p>
          <p className="text-muted-foreground">{opp.role}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusPill status={opp.status} />
          {showVisibility &&
            (opp.isPublic ? (
              <span
                title="Visible on your public profile"
                className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-grape"
              >
                <Eye size={12} /> public
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-muted-foreground">
                <EyeOff size={12} /> private
              </span>
            ))}
        </div>
      </div>

      {opp.nextStep && (
        <p className="text-sm">
          <span className="text-muted-foreground">Next:</span>{" "}
          <span className="font-semibold">{opp.nextStep}</span>
          {opp.nextStepBy && (
            <span className="text-muted-foreground"> · {opp.nextStepBy}</span>
          )}
        </p>
      )}
      {opp.source && (
        <p className="text-xs text-muted-foreground mt-2">via {opp.source}</p>
      )}
      {opp.link && (
        <p className="text-xs mt-1">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <ExternalLink size={11} /> {new URL(opp.link).host}
          </span>
        </p>
      )}
    </Link>
  );
}
