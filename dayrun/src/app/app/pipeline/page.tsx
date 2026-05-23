"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuthUser } from "@/lib/auth";
import {
  COLLECTIONS,
  type OpportunityDoc,
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
} from "@/lib/firebase/collections";
import { OpportunityCard } from "@/components/pipeline/OpportunityCard";
import { QuickAdd } from "@/components/pipeline/QuickAdd";
import { StatusPill } from "@/components/pipeline/StatusPill";

export default function PipelinePage() {
  const { user, loading } = useAuthUser();
  const [opps, setOpps] = useState<OpportunityDoc[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [bulkPending, setBulkPending] = useState<"public" | "private" | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, COLLECTIONS.opportunities(user.uid)), orderBy("updatedAt", "desc")),
      (snap) => {
        setOpps(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OpportunityDoc));
        setBootstrapped(true);
      },
    );
    return () => unsub();
  }, [user]);

  if (loading) return <div className="chunky p-8">Loading…</div>;
  if (!user)
    return (
      <div className="chunky p-6">
        Please <Link href="/app" className="underline font-semibold">sign in</Link>.
      </div>
    );

  const active = opps.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const closed = opps.filter((o) => CLOSED_STATUSES.includes(o.status));
  const publicCount = opps.filter((o) => o.isPublic).length;

  async function bulkSetVisibility(scope: "active" | "all", next: boolean) {
    if (!user) return;
    setBulkPending(next ? "public" : "private");
    try {
      const idToken = await user.getIdToken();
      const targets = scope === "active" ? active : opps;
      await Promise.all(
        targets
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
  const grouped = new Map<string, OpportunityDoc[]>();
  for (const o of active) {
    if (!grouped.has(o.status)) grouped.set(o.status, []);
    grouped.get(o.status)!.push(o);
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

      <QuickAdd />

      {opps.length > 0 && (
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
              onClick={() => bulkSetVisibility("active", true)}
              disabled={!!bulkPending || active.every((o) => o.isPublic)}
              className="btn-chunky btn-sun text-sm py-2 px-3 flex-1 sm:flex-initial"
              title="Mark all active pipeline items public (linked events cascade too)"
            >
              <Eye size={14} />
              {bulkPending === "public" ? "…" : "Share all active"}
            </button>
            <button
              onClick={() => bulkSetVisibility("all", false)}
              disabled={!!bulkPending || opps.every((o) => !o.isPublic)}
              className="btn-chunky btn-ghost text-sm py-2 px-3 flex-1 sm:flex-initial"
              title="Mark every pipeline item private"
            >
              <EyeOff size={14} />
              {bulkPending === "private" ? "…" : "Hide all"}
            </button>
          </div>
        </div>
      )}

      {bootstrapped && opps.length === 0 ? (
        <div className="chunky p-8 text-center space-y-2">
          <p className="font-heading text-2xl">Nothing in your pipeline yet.</p>
          <p className="text-muted-foreground">
            Add your first one above. Referrals, applications, even cold ideas — track them all.
          </p>
        </div>
      ) : (
        <>
          {/* Active grouped by status */}
          {ACTIVE_STATUSES.map((s) => {
            const items = grouped.get(s) ?? [];
            if (items.length === 0) return null;
            return (
              <section key={s} className="space-y-3">
                <div className="flex items-center gap-3">
                  <StatusPill status={s} />
                  <span className="text-sm text-muted-foreground font-mono">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {items.map((o) => (
                    <OpportunityCard key={o.id} opp={o} href={`/app/pipeline/${o.id}`} />
                  ))}
                </div>
              </section>
            );
          })}

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
