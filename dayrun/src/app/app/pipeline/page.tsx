"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/auth";
import {
  COLLECTIONS,
  type Compensation,
  type EventDoc,
  type OpportunityDoc,
  type OpportunityPrivateDoc,
  CLOSED_STATUSES,
  isActive,
  normalizeOpportunityStatus,
} from "@/lib/firebase/collections";
import { OpportunityCard } from "@/components/pipeline/OpportunityCard";
import { QuickAdd } from "@/components/pipeline/QuickAdd";
import {
  compareOpportunitiesByNext,
  enhanceOpportunityWithEvents,
  formatPipelineDateLong,
  getNextRoundAt,
  parsePipelineDate,
  todayStartMs,
} from "@/lib/pipeline";

export default function PipelinePage() {
  const { user, loading } = useAuthUser();
  const [opps, setOpps] = useState<OpportunityDoc[]>([]);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [compensationByOppId, setCompensationByOppId] = useState<Record<string, Compensation | null>>({});
  const [bootstrapped, setBootstrapped] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [bulkPending, setBulkPending] = useState<"public" | "private" | null>(null);
  const oppIdsKey = useMemo(() => opps.map((opp) => opp.id).sort().join("|"), [opps]);

  useEffect(() => {
    if (!user) return;
    const unsubOpps = onSnapshot(
      query(collection(db, COLLECTIONS.opportunities(user.uid)), orderBy("updatedAt", "desc")),
      (snap) => {
        setOpps(
          snap.docs.map(
            (d) =>
              ({
                id: d.id,
                ...d.data(),
                status: normalizeOpportunityStatus(d.data().status),
              }) as OpportunityDoc,
          ),
        );
        setBootstrapped(true);
      },
    );
    const unsubEvents = onSnapshot(
      query(collection(db, COLLECTIONS.events(user.uid)), orderBy("start", "asc")),
      (snap) => setEvents(snap.docs.map((d) => d.data() as EventDoc)),
    );
    return () => {
      unsubOpps();
      unsubEvents();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const ids = oppIdsKey ? oppIdsKey.split("|") : [];
    const unsubs = ids.map((id) => {
      const ref = doc(db, COLLECTIONS.opportunityPrivate(user.uid, id), "data");
      return onSnapshot(ref, (snap) => {
        const data = snap.exists() ? (snap.data() as Partial<OpportunityPrivateDoc>) : null;
        setCompensationByOppId((current) => ({
          ...current,
          [id]: data?.compensation ?? null,
        }));
      });
    });

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [oppIdsKey, user]);

  const displayOpps = useMemo(
    () =>
      opps.map((opp) => ({
        ...enhanceOpportunityWithEvents(opp, events),
        compensation: compensationByOppId[opp.id] ?? null,
      })),
    [compensationByOppId, events, opps],
  );

  if (loading) return <div className="chunky p-8">Loading…</div>;
  if (!user)
    return (
      <div className="chunky p-6">
        Please <Link href="/app" className="underline font-semibold">sign in</Link>.
      </div>
    );

  const active = displayOpps
    .filter((o) => isActive(o.status))
    .sort(compareOpportunitiesByNext);
  const closed = displayOpps
    .filter((o) => CLOSED_STATUSES.includes(normalizeOpportunityStatus(o.status)))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const publicCount = displayOpps.filter((o) => o.isPublic).length;
  const upcomingCount = active.filter((o) => {
    const next = parsePipelineDate(getNextRoundAt(o));
    return next !== null && next >= todayStartMs();
  }).length;
  const nextUp = active.find((o) => {
    const next = parsePipelineDate(getNextRoundAt(o));
    return next !== null && next >= todayStartMs();
  });

  async function bulkSetVisibility(next: boolean) {
    if (!user) return;
    setBulkPending(next ? "public" : "private");
    try {
      const idToken = await user.getIdToken();
      await Promise.all(
        displayOpps
          .filter((o) => o.isPublic !== next)
          .map((o) =>
            fetch(`/api/pipeline/${o.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
              body: JSON.stringify({ isPublic: next }),
            }),
          ),
      );
    } finally {
      setBulkPending(null);
    }
  }
  return (
    <div className="space-y-8">
      <div>
        <Link href="/app" className="text-sm text-muted-foreground hover:text-ink inline-flex items-center gap-1">
          <ArrowLeft size={14} /> dashboard
        </Link>
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold mt-1">Pipeline</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Track interviews, referrals, and what you&apos;re chasing. Toggle items public to show on{" "}
          <Link href="/app/settings" className="underline">your profile</Link>.
        </p>
      </div>

      {displayOpps.length > 0 && (
        <section className="grid sm:grid-cols-3 gap-3">
          <div className="chunky p-4">
            <p className="dy-eyebrow">active</p>
            <p className="font-heading text-3xl mt-1">{active.length}</p>
            <p className="text-xs text-muted-foreground">open opportunities</p>
          </div>
          <div className="chunky chunky-coral p-4">
            <p className="dy-eyebrow">scheduled</p>
            <p className="font-heading text-3xl mt-1">{upcomingCount}</p>
            <p className="text-xs text-muted-foreground">with upcoming rounds</p>
          </div>
          <div className="chunky p-4">
            <p className="dy-eyebrow">next round</p>
            <p className="font-heading text-xl mt-1 truncate">
              {nextUp ? nextUp.company : "Nothing scheduled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {nextUp ? formatPipelineDateLong(getNextRoundAt(nextUp)) : "Add dates to sort the queue"}
            </p>
          </div>
        </section>
      )}

      <QuickAdd />

      {displayOpps.length > 0 && (
        <div className={`chunky p-4 space-y-3 ${publicCount === 0 ? "chunky-sun" : ""}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-mono">
              <span className="text-muted-foreground">
                {active.length} active · {closed.length} closed ·{" "}
              </span>
              <span className={publicCount === 0 ? "text-ink font-bold" : "text-muted-foreground"}>
                {publicCount} public
              </span>
            </p>
            {publicCount === 0 && (
              <span className="text-xs font-semibold text-ink">
                ↓ Nothing on your public profile yet. Share something to start.
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => bulkSetVisibility(true)}
              disabled={!!bulkPending || displayOpps.every((o) => o.isPublic)}
              className="btn-chunky btn-sun text-sm py-2 px-3 flex-1 sm:flex-initial"
              title="Mark every pipeline item public (linked events cascade too)"
            >
              <Eye size={14} />
              {bulkPending === "public" ? "…" : "Share all"}
            </button>
            <button
              onClick={() => bulkSetVisibility(false)}
              disabled={!!bulkPending || displayOpps.every((o) => !o.isPublic)}
              className="btn-chunky btn-ghost text-sm py-2 px-3 flex-1 sm:flex-initial"
              title="Mark every pipeline item private"
            >
              <EyeOff size={14} />
              {bulkPending === "private" ? "…" : "Hide all"}
            </button>
          </div>
        </div>
      )}

      {bootstrapped && displayOpps.length === 0 ? (
        <div className="chunky p-8 text-center space-y-2">
          <p className="font-heading text-2xl">Nothing in your pipeline yet.</p>
          <p className="text-muted-foreground">
            Add your first one above. Referrals, applications, even cold ideas — track them all.
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="font-heading text-2xl font-bold">Coming up</h2>
                  <p className="text-sm text-muted-foreground">
                    Sorted by the next scheduled round, then by stage.
                  </p>
                </div>
                <span className="dy-mono">{active.length} active</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {active.map((o) => (
                  <OpportunityCard key={o.id} opp={o} href={`/app/pipeline/${o.id}`} />
                ))}
              </div>
            </section>
          )}

          {/* Closed (collapsed) */}
          {closed.length > 0 && (
            <section className="space-y-3">
              <button
                onClick={() => setShowClosed((s) => !s)}
                className="btn-chunky btn-ghost w-full justify-center"
              >
                {showClosed ? "Hide" : "Show"} {closed.length} closed
              </button>
              {showClosed && (
                <div className="grid md:grid-cols-2 gap-3 opacity-80">
                  {closed.map((o) => (
                    <OpportunityCard key={o.id} opp={o} href={`/app/pipeline/${o.id}`} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
