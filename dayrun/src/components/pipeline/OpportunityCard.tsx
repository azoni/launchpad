"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, ExternalLink, Eye, EyeOff } from "lucide-react";
import type { OpportunityDoc } from "@/lib/firebase/collections";
import { useAuthUser } from "@/lib/auth";
import {
  compactRoundNumberLabel,
  formatPipelineDate,
  formatPipelineDateLong,
  getCurrentRound,
  getFirstRoundAt,
  getLastRoundAt,
  getNextRoundAt,
  isClosedOpportunity,
  nextStepLabel,
  visibleRounds,
} from "@/lib/pipeline";
import { StatusPill } from "./StatusPill";
import { RoundProgressDots } from "./RoundProgressDots";

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

  const firstRound = getFirstRoundAt(opp);
  const nextRound = getNextRoundAt(opp);
  const lastRound = getLastRoundAt(opp);
  const currentRound = getCurrentRound(opp);
  const isClosed = isClosedOpportunity(opp);
  const rounds = visibleRounds(opp, 4);
  const nextLabel = nextStepLabel(opp);
  const focusDate = isClosed ? lastRound : nextRound;
  const displayStatus = !isClosed && !nextRound ? "awaiting" : opp.status;

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
          <StatusPill status={displayStatus} />
        </div>
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <RoundProgressDots opp={opp} />
          <span>{opp.plannedRounds ?? (rounds.length || 1)} round process</span>
        </div>

        {(nextLabel || nextRound || firstRound || rounds.length > 0) && (
          <div className="mt-3 space-y-2">
            <div
              className={`rounded-lg border px-3 py-2 ${
                isClosed ? "border-hairline bg-surface" : "border-primary/50 bg-sun/10"
              }`}
            >
              <p className="dy-eyebrow">{isClosed ? "closed with" : "focus next"}</p>
              <p className="text-sm font-semibold text-ink mt-1">
                {nextLabel ?? (isClosed ? "Process closed" : "Next step TBD")}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock size={12} />
                  {formatPipelineDateLong(focusDate, isClosed ? "No final date" : "No next date")}
                </span>
                {!isClosed && currentRound?.outcome && <span>{currentRound.outcome}</span>}
                {!isClosed && opp.nextStepBy && <span>{opp.nextStepBy}</span>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <div className="rounded-lg border border-hairline bg-surface px-3 py-2">
              <p className="dy-eyebrow">first round</p>
              <p className="text-sm font-semibold text-ink mt-1">
                {formatPipelineDate(firstRound, "Not set")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {rounds.length > 0 ? `${rounds.length} tracked rounds` : "Add rounds inside"}
              </p>
              </div>
              <div className="rounded-lg border border-hairline bg-surface px-3 py-2">
                <p className="dy-eyebrow">{isClosed ? "last round" : "process"}</p>
                <p className="text-sm font-semibold text-ink mt-1">
                  {isClosed
                    ? formatPipelineDate(lastRound, "Not set")
                    : `${rounds.length} ${rounds.length === 1 ? "round" : "rounds"}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isClosed ? "closed item" : firstRound ? "ordered by next date" : "add dates to sort"}
                </p>
              </div>
            </div>
          </div>
        )}

        {rounds.length > 0 && (
          <ol className="mt-3 flex flex-wrap gap-1.5">
            {rounds.map((round, index) => (
              <li
                key={round.id}
                className={`dy-pill ${
                  round.outcome === "passed"
                    ? "dy-pill-positive"
                    : round.outcome === "did-not-pass" || round.outcome === "cancelled"
                      ? "dy-pill-outline"
                      : "dy-pill-neutral"
                }`}
              >
                {compactRoundNumberLabel(round, index + 1)} -{" "}
                {formatPipelineDate(round.scheduledAt, "TBD")} - {round.title}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {opp.locationType && <span>{opp.locationType}</span>}
          {opp.source && <span>via {opp.source}</span>}
          {opp.link && (
            <span className="inline-flex items-center gap-1">
              <ExternalLink size={11} /> {new URL(opp.link).host}
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 pt-3 border-t border-hairline flex items-center justify-between gap-2">
        <button
          onClick={toggle}
          disabled={pending}
          aria-pressed={optimistic}
          className={`dy-pill ${
            optimistic ? "dy-pill-positive" : "dy-pill-outline"
          } hover:opacity-80`}
          title={
            optimistic
              ? "On your public profile. Click to make private."
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
          Open {"->"}
        </Link>
      </div>
    </div>
  );
}
