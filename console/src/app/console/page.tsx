"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
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
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                <span className="font-mono text-primary">$</span> launchpad
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your invite code to continue
              </p>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                type="text"
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="font-mono text-center tracking-widest"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading || !inviteCode}>
                {loading ? "Validating..." : "Enter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="font-mono text-primary">$</span> launchpad
          </h1>
          <p className="text-muted-foreground">
            Describe an app. Get a deployed URL.
          </p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-6 pb-6 px-6">
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !prompt.trim()}
              >
                {loading ? "Starting build..." : "Launch"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center">
          Builds take 5-15 minutes. You&apos;ll see progress in real time.
        </p>
      </div>
    </main>
  );
}
