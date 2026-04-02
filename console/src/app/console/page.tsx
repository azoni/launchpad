"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Rocket, ArrowLeft, Loader2, Lock } from "lucide-react";

export default function ConsolePage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("launchpad_invite");
    if (stored) {
      setInviteCode(stored);
      setAuthenticated(true);
    }
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/invite/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem("launchpad_invite", inviteCode);
        setAuthenticated(true);
      } else {
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Failed to validate code");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuild(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, inviteCode }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push(`/build/${data.buildId}`);
      } else {
        setError(data.error || "Build failed");
        setLoading(false);
      }
    } catch {
      setError("Failed to start build");
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 bg-grid">
        <div className="w-full max-w-md">
          <div className="card-glow p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-xl bg-neon-muted border border-neon/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5 h-5 text-neon" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                <span className="text-gradient">launchpad</span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your invite code to continue
              </p>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <input
                type="text"
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-mono text-center tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon/30 transition-all"
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !inviteCode}
                className="btn-neon w-full justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Enter"
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-xs text-muted-foreground/50 hover:text-neon transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to gallery
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-grid">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <Link
            href="/"
            className="inline-block mb-4 text-xs text-muted-foreground/50 hover:text-neon transition-colors"
          >
            <ArrowLeft className="w-3 h-3 inline mr-1" />
            Back to gallery
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="text-gradient">launchpad</span>
          </h1>
          <p className="text-muted-foreground">
            Describe an app. Get a deployed URL.
          </p>
        </div>

        <div className="card-glow p-6">
          <form onSubmit={handleBuild} className="space-y-4">
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                What do you want to build?
              </label>
              <textarea
                id="prompt"
                rows={4}
                placeholder="A recipe sharing app where users can save meals, plan their week, and generate grocery lists. Fun, colorful design with food emoji vibes."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-neon/50 focus:border-neon/30 resize-none transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="btn-neon w-full justify-center py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting build...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  Launch
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground/50 text-center">
          Builds take 5-15 minutes. You&apos;ll see progress in real time.
        </p>
      </div>
    </main>
  );
}
