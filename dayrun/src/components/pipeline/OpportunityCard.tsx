"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import type { OpportunityDoc } from "@/lib/firebase/collections";
import { useAuthUser } from "@/lib/auth";
import { StatusPill } from "./StatusPill";

export function OpportunityCard({
  opp,
  href,
}: {
  opp: OpportunityDoc;
  href: string;
}) {
  const { user } = useAuthUser();
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState(opp.isPublic);

  // Stay in sync if the snapshot updates externally.
  if (opp.isPublic !== optimistic && !pending) setOptimistic(opp.isPublic);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || pending) return;
    setPending(true);
    const next = !optimistic;
    setOptimistic(next);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/pipeline/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ isPublic: next }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      setOptimistic(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="block chunky p-4 md:p-5 tilt-hover relative">
      <Link href={href} className="block hover:no-underline">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
          <div className="min-w-0">
            <p className="font-heading text-xl md:text-2xl font-bold leading-tight">
              {opp.company}
            </p>
            <p className="text-muted-foreground">{opp.role}</p>
          </div>
          <StatusPill status={opp.status} />
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
        {opp.locationType && (
          <p className="text-xs text-muted-foreground mt-1.5">
            📍 {opp.locationType}
          </p>
        )}
        {opp.source && (
          <p className="text-xs text-muted-foreground mt-1">via {opp.source}</p>
        )}
        {opp.link && (
          <p className="text-xs mt-1">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <ExternalLink size={11} /> {new URL(opp.link).host}
            </span>
          </p>
        )}
      </Link>

      <div className="mt-3 pt-3 border-t-2 border-dashed border-ink/15 flex items-center justify-between gap-2">
        <button
          onClick={toggle}
          disabled={pending}
          aria-pressed={optimistic}
          className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-ink text-xs font-bold transition-colors ${
            optimistic
              ? "bg-sun text-ink hover:bg-[#FFC54A]"
              : "bg-card text-muted-foreground hover:bg-muted"
          }`}
          title={
            optimistic
              ? "On your public profile (linked calendar events too). Click to make private."
              : "Hidden from your public profile. Click to share."
          }
        >
          {optimistic ? <Eye size={13} /> : <EyeOff size={13} />}
          {optimistic ? "public" : "private"}
        </button>
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-ink font-semibold inline-flex items-center gap-1"
        >
          Open →
        </Link>
      </div>
    </div>
  );
}
