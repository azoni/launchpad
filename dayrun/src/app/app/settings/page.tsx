"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuthUser, signOut } from "@/lib/auth";
import { COLLECTIONS, type UserDoc } from "@/lib/firebase/collections";

const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,23}$/;

export default function SettingsPage() {
  const { user, loading } = useAuthUser();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [username, setUsername] = useState("");
  const [publicProfile, setPublicProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.users, user.uid));
      const data = snap.exists() ? (snap.data() as UserDoc) : null;
      setProfile(data);
      setUsername(data?.username ?? "");
      setPublicProfile(data?.publicProfile ?? true);
    })();
  }, [user]);

  async function save() {
    if (!user) return;
    if (!USERNAME_RE.test(username)) {
      setError("Username must be 3–24 chars, lowercase, letters/numbers/_/-, starting with a letter or number.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ username, publicProfile }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="chunky p-6">Loading…</div>;
  if (!user) return <div className="chunky p-6">Please sign in.</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-heading text-4xl font-bold">Settings</h1>

      <div className="chunky p-5 space-y-4">
        <div>
          <label htmlFor="username" className="block font-semibold mb-1">
            Username
          </label>
          <p className="text-sm text-muted-foreground mb-2">
            Your public profile lives at <span className="font-mono">/u/&lt;username&gt;</span>.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground">/u/</span>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
              placeholder="e.g. charltonuw"
              className="flex-1 border-2 border-ink rounded-xl px-3 py-2 bg-card font-mono"
            />
          </div>
        </div>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={publicProfile}
            onChange={(e) => setPublicProfile(e.target.checked)}
            className="mt-1 h-5 w-5 accent-primary"
          />
          <span>
            <span className="font-semibold">Public profile</span>
            <span className="block text-sm text-muted-foreground">
              When on, your public profile page is reachable. Individual events still need to be
              toggled public separately.
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving} className="btn-chunky">
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-sm font-semibold text-green-700">Saved ✓</span>}
          {error && <span className="text-sm font-semibold text-red-700">{error}</span>}
        </div>
      </div>

      <div className="chunky p-5 space-y-2">
        <p className="font-heading text-xl">Account</p>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-mono">{user.email}</span>
        </p>
        <button onClick={() => signOut()} className="btn-chunky btn-ghost mt-2">
          Sign out
        </button>
      </div>

      {profile?.lastSyncedAt && (
        <p className="text-sm text-muted-foreground">
          Last calendar sync: {new Date(profile.lastSyncedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
