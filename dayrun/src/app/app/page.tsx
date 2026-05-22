"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthUser, signInWithGoogle, signOut } from "@/lib/auth";
import { SignInWithGoogle } from "@/components/SignInWithGoogle";
import { WeekView } from "@/components/WeekView";
import { COLLECTIONS, type EventDoc, type UserDoc } from "@/lib/firebase/collections";

export default function AppPage() {
  const { user, loading } = useAuthUser();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Subscribe to profile + events when signed in.
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
      (snap) => {
        setEvents(snap.docs.map((d) => d.data() as EventDoc));
      },
    );
    return () => {
      cancelled = true;
      unsubProfile();
      unsubEvents();
    };
  }, [user]);

  const runSync = useCallback(
    async (accessToken: string | null) => {
      if (!user) return;
      if (!accessToken) {
        setSyncError("No Google access token. Try signing in again.");
        return;
      }
      setSyncing(true);
      setSyncError(null);
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
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : "Sync failed");
      } finally {
        setSyncing(false);
      }
    },
    [user],
  );

  async function handleSyncClick() {
    setSyncError(null);
    try {
      const { accessToken } = await signInWithGoogle();
      await runSync(accessToken);
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Sync failed");
    }
  }

  async function toggleVisibility(eventId: string, next: boolean) {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch("/api/event/visibility", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ eventId, isPublic: next }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  if (loading) {
    return <div className="chunky p-8">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-5xl font-bold">Sign in to DayRun</h1>
          <p className="text-muted-foreground text-lg">
            We use Google Sign-In to read your Calendar. Read-only. Nothing is public unless you flip
            the toggle.
          </p>
          <SignInWithGoogle onSignedIn={runSync} />
        </div>
        <div className="chunky chunky-sun p-5">
          <p className="font-heading text-xl mb-2">Heads up</p>
          <p className="text-sm text-muted-foreground">
            On first sign-in you&apos;ll grant calendar access. The popup may say &quot;unverified&quot; while we&apos;re
            still in OAuth test mode — go ahead and continue if you trust this build.
          </p>
        </div>
      </div>
    );
  }

  const hasUsername = !!profile?.username;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-4xl md:text-5xl font-bold">
            Hi, {user.displayName?.split(" ")[0] ?? "there"} 👋
          </h1>
          {hasUsername ? (
            <p className="text-muted-foreground">
              Your public profile:{" "}
              <Link
                href={`/u/${profile!.username}`}
                className="underline decoration-2 underline-offset-4 hover:text-ink font-semibold"
              >
                /u/{profile!.username}
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
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSyncClick} disabled={syncing} className="btn-chunky">
            {syncing ? "Syncing…" : events.length === 0 ? "Sync calendar →" : "Re-sync"}
          </button>
          <Link href="/app/settings" className="btn-chunky btn-ghost">
            Settings
          </Link>
          <button onClick={() => signOut()} className="btn-chunky btn-ghost">
            Sign out
          </button>
        </div>
      </div>

      {syncError && (
        <div className="chunky p-4 border-red-700 text-red-700 bg-red-50">
          <p className="font-semibold">Sync error</p>
          <p className="text-sm">{syncError}</p>
        </div>
      )}

      {bootstrapped && (
        <WeekView
          events={events}
          editable
          onToggleVisibility={toggleVisibility}
          emptyState={
            <div className="space-y-3">
              <p className="font-heading text-xl">No events synced yet.</p>
              <p className="text-muted-foreground">
                Hit <strong>Sync calendar</strong> above to pull in the next two weeks.
              </p>
            </div>
          }
        />
      )}
    </div>
  );
}
