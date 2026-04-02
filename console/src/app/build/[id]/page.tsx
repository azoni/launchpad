"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Build {
  id: string;
  prompt: string;
  slug: string;
  status: "queued" | "building" | "complete" | "failed";
  netlifyUrl: string | null;
  error: string | null;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

const STATUS_CONFIG = {
  queued: { label: "Queued", variant: "secondary" as const, pulse: true },
  building: { label: "Building", variant: "default" as const, pulse: true },
  complete: { label: "Complete", variant: "default" as const, pulse: false },
  failed: { label: "Failed", variant: "destructive" as const, pulse: false },
};

export default function BuildPage() {
  const { id } = useParams<{ id: string }>();
  const [build, setBuild] = useState<Build | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const fetchBuild = useCallback(async () => {
    const res = await fetch(`/api/build/${id}`);
    if (res.ok) {
      const data = await res.json();
      setBuild(data);
      return data.status;
    }
    return null;
  }, [id]);

  useEffect(() => {
    fetchBuild();
    const interval = setInterval(async () => {
      const status = await fetchBuild();
      if (status === "complete" || status === "failed") {
        clearInterval(interval);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchBuild]);

  useEffect(() => {
    if (!build || build.status === "complete" || build.status === "failed") return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [build]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!build) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <p className="text-muted-foreground font-mono">Loading build...</p>
      </main>
    );
  }

  const config = STATUS_CONFIG[build.status];

  return (
    <main className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight mb-2 inline-block hover:opacity-80">
            <span className="font-mono text-primary">$</span> launchpad
          </Link>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="pt-6 pb-6 px-6 space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant={config.variant} className={config.pulse ? "animate-pulse" : ""}>
                {config.label}
              </Badge>
              {(build.status === "queued" || build.status === "building") && (
                <span className="text-sm font-mono text-muted-foreground">
                  {formatTime(elapsed)}
                </span>
              )}
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Prompt
              </p>
              <p className="text-sm">{build.prompt}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                App Slug
              </p>
              <p className="text-sm font-mono">{build.slug}</p>
            </div>

            {build.status === "queued" && (
              <div className="rounded-md bg-muted/50 p-4 font-mono text-xs text-muted-foreground space-y-1">
                <p>Waiting for GitHub Actions runner...</p>
                <p className="animate-pulse">This can take 30-60 seconds to start.</p>
              </div>
            )}

            {build.status === "building" && (
              <div className="rounded-md bg-muted/50 p-4 font-mono text-xs text-muted-foreground space-y-1">
                <p>Claude Code is building your app...</p>
                <p>Scaffolding, designing, configuring, deploying.</p>
                <p className="animate-pulse">Usually takes 5-15 minutes.</p>
              </div>
            )}

            {build.status === "complete" && build.netlifyUrl && (
              <div className="space-y-3">
                <div className="rounded-md bg-green-950/30 border border-green-800/50 p-4 text-center">
                  <p className="text-sm text-green-400 mb-2">Your app is live!</p>
                  <a
                    href={build.netlifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-mono text-green-300 hover:underline"
                  >
                    {build.netlifyUrl}
                  </a>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    render={<a href={build.netlifyUrl} target="_blank" rel="noopener noreferrer" />}
                  >
                    Open App
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    render={<Link href="/" />}
                  >
                    Build Another
                  </Button>
                </div>
              </div>
            )}

            {build.status === "failed" && (
              <div className="space-y-3">
                <div className="rounded-md bg-red-950/30 border border-red-800/50 p-4">
                  <p className="text-sm text-red-400">
                    {build.error || "Build failed. Check GitHub Actions logs for details."}
                  </p>
                </div>
                <Button variant="outline" className="w-full" render={<Link href="/" />}>
                  Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
