"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { Briefcase, Eye, EyeOff, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuthUser, signInWithGoogle, signOut } from "@/lib/auth";
import { SignInWithGoogle } from "@/components/SignInWithGoogle";
import { TimelineView } from "@/components/TimelineView";
import { InterviewSuggestions } from "@/components/InterviewSuggestions";
import {
  COLLECTIONS,
  type EventDoc,
  type EventNotesDoc,
  type OpportunityDoc,
  type UserDoc,
  ACTIVE_STATUSES,
} from "@/lib/firebase/collections";

export default function AppPage() {
  const { user, loading } = useAuthUser();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityDoc[]>([]);
  const [eventNotes, setEventNotes] = useState<Map<string, EventNotesDoc>>(new Map());
  const [syncing, setSyncing] = useState(false);
  const [bulkPending, setBulkPending] = useState<"public" | "private" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setEvents([]);
      setBootstrapped(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.users, user.uid));
      if (!cancelled) {
        setProfile(snap.exists() ? (snap.data() as UserDoc) : null);
        setBootstrapped(true);
      }
    })();
    const unsubProfile = onSnapshot(doc(db, COLLECTIONS.users, user.uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserDoc) : null);
    });
    const unsubEvents = onSnapshot(
      query(collection(db, COLLECTIONS.events(user.uid)), orderBy("start", "asc")),
      (snap) => setEvents(snap.docs.map((d) => d.data() as EventDoc)),
    );
    const unsubOpps = onSnapshot(
      query(collection(db, COLLECTIONS.opportunities(user.uid)), orderBy("updatedAt", "desc")),
      (snap) => setOpportunities(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc))),
    );
    const unsubNotes = onSnapshot(
      collection(db, COLLECTIONS.eventNotes(user.uid)),
      (snap) => {
        const m = new Map<string, EventNotesDoc>();
        for (const d of snap.docs) m.set(d.id, d.data() as EventNotesDoc);
        setEventNotes(m);
      },
    );
    return () => {
      cancelled = true;
      unsubProfile();
      unsubEvents();
      unsubOpps();
      unsubNotes();
    };
  }, [user]);

  const oppsById = useMemo(() => {
    const m = new Map<string, OpportunityDoc>();
    for (const o of opportunities) m.set(o.id, o);
    return m;
  }, [opportunities]);
  const activeOppsCount = useMemo(
    () => opportunities.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    [opportunities],
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = events.filter((e) => new Date(e.start).getTime() >= now - 86400_000);
    const publicCount = events.filter((e) => e.isPublic).length;
    return { total: events.length, upcoming: upcoming.length, public: publicCount };
  }, [events]);

  const runSync = useCallback(
    async (accessToken: string | null) => {
      if (!user) return;
      if (!accessToken) {
        setError("No Google access token. Try signing in again.");
        return;
      }
      setSyncing(true);
      setError(null);
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ accessToken }),
        });
        if (!res.ok) throw new Error(await res.text());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sync failed");
      } finally {
        setSyncing(false);
      }
    },
    [user],
  );

  async function handleSyncClick() {
    setError(null);
    try {
      const { accessToken } = await signInWithGoogle();
      await runSync(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    }
  }

  async function toggleOne(eventId: string, next: boolean) {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch("/api/event/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ eventId, isPublic: next }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function saveEventNotes(eventId: string, update: Partial<EventNotesDoc>) {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch("/api/event/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ eventId, ...update }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function toggleMany(ids: string[], next: boolean) {
    if (!user || ids.length === 0) return;
    const idToken = await user.getIdToken();
    const res = await fetch("/api/events/bulk-visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ ids, isPublic: next }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function bulkAll(scope: "upcoming" | "all", next: boolean) {
    if (!user) return;
    const setKind = next ? "public" : "private";
    setBulkPending(setKind);
    setError(null);
    try {
      const now = Date.now();
      const ids =
        scope === "upcoming"
          ? events
              .filter((e) => new Date(e.start).getTime() >= now - 86400_000)
              .map((e) => e.googleEventId)
          : events.map((e) => e.googleEventId);
      await toggleMany(ids, next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setBulkPending(null);
    }
  }

  if (loading) return <div className="chunky p-8">Loading…</div>;

  if (!user) {
    return (
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Sign in to DayRun</h1>
          <p className="text-muted-foreground text-lg">
            Read-only access to your Google Calendar. Nothing public unless you flip the toggle.
          </p>
          <SignInWithGoogle onSignedIn={runSync} />
        </div>
        <div className="chunky chunky-sun p-5">
          <p className="font-heading text-xl mb-2">Heads up</p>
          <p className="text-sm text-muted-foreground">
            On the first sign-in Google will show an &ldquo;unverified&rdquo; warning — that&apos;s expected
            while we&apos;re in OAuth test mode. Click <strong>Advanced → Go to DayRun (unsafe)</strong>{" "}
            to continue.
          </p>
        </div>
      </div>
    );
  }

  const hasUsername = !!profile?.username;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="font-heading text-4xl md:text-5xl font-bold">
            Hi, {user.displayName?.split(" ")[0] ?? "there"} 👋
          </h1>
          {hasUsername ? (
            <p className="text-muted-foreground">
              Your public profile:{" "}
              <Link
                href={`/u/${profile!.username}`}
                target="_blank"
                className="underline decoration-2 underline-offset-4 hover:text-ink font-semibold"
              >
                /u/{profile!.username} ↗
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Pick a username on{" "}
              <Link href="/app/settings" className="underline font-semibold">
                Settings
              </Link>{" "}
              to enable your public profile.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Link href="/app/pipeline" className="btn-chunky btn-grape text-sm py-2 px-3 sm:text-base sm:py-3 sm:px-5">
            <Briefcase size={14} />
            Pipeline{activeOppsCount > 0 ? ` · ${activeOppsCount}` : ""}
          </Link>
          <Link href="/app/settings" className="btn-chunky btn-ghost text-sm py-2 px-3 sm:text-base sm:py-3 sm:px-5">
            Settings
          </Link>
          <button onClick={() => signOut()} className="btn-chunky btn-ghost text-sm py-2 px-3 sm:text-base sm:py-3 sm:px-5">
            Sign out
          </button>
        </div>
      </div>

      {/* Action bar */}
      <div className="chunky p-4 md:p-5 space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleSyncClick} disabled={syncing} className="btn-chunky">
              <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : events.length === 0 ? "Sync calendar" : "Re-sync"}
            </button>
            {events.length > 0 && (
              <>
                <button
                  onClick={() => bulkAll("upcoming", true)}
                  disabled={!!bulkPending}
                  className="btn-chunky btn-sun text-sm py-2 px-3"
                  title="Mark every upcoming event public"
                >
                  <Eye size={14} />
                  {bulkPending === "public" ? "…" : "Share upcoming"}
                </button>
                <button
                  onClick={() => bulkAll("all", false)}
                  disabled={!!bulkPending}
                  className="btn-chunky btn-ghost text-sm py-2 px-3"
                  title="Mark every event private"
                >
                  <EyeOff size={14} />
                  {bulkPending === "private" ? "…" : "Hide all"}
                </button>
              </>
            )}
          </div>
          {events.length > 0 && (
            <span className="text-xs sm:text-sm text-muted-foreground font-mono">
              {stats.upcoming} upcoming · {stats.public} public
            </span>
          )}
        </div>
        {profile?.lastSyncedAt && (
          <p className="text-xs text-muted-foreground">
            Last synced {new Date(profile.lastSyncedAt).toLocaleString()}
          </p>
        )}
      </div>

      {error && (
        <div className="chunky p-4 border-red-700 text-red-700 bg-red-50">
          <p className="font-semibold">Something went wrong</p>
          <p className="text-sm break-all">{error}</p>
        </div>
      )}

      {bootstrapped && events.length > 0 && (
        <InterviewSuggestions events={events} />
      )}

      {bootstrapped && (
        <TimelineView
          events={events}
          editable
          actions={{ toggleOne, toggleMany, saveEventNotes }}
          opportunitiesById={oppsById}
          eventNotesById={eventNotes}
          ownerView
          emptyState={
            <div className="space-y-3">
              <p className="font-heading text-2xl">No events synced yet.</p>
              <p className="text-muted-foreground">
                Hit <strong>Sync calendar</strong> above to pull in the last 30 days and the next 30 days.
              </p>
            </div>
          }
        />
      )}
    </div>
  );
}
