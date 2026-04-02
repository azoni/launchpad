"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ExternalLink,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Rocket,
} from "lucide-react";

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
  queued: {
    label: "Queued",
    color: "text-muted-foreground",
    bgColor: "bg-muted-foreground",
    icon: Clock,
    pulse: true,
  },
  building: {
    label: "Building",
    color: "text-neon",
    bgColor: "bg-neon",
    icon: Loader2,
    pulse: true,
  },
  complete: {
    label: "Complete",
    color: "text-success",
    bgColor: "bg-success",
    icon: CheckCircle,
    pulse: false,
  },
  failed: {
    label: "Failed",
    color: "text-destructive",
    bgColor: "bg-destructive",
    icon: XCircle,
    pulse: false,
  },
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
    if (!build || build.status === "complete" || build.status === "failed")
      return;
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
      <main className="flex-1 flex items-center justify-center p-6 bg-grid">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-mono text-sm">Loading build...</span>
        </div>
      </main>
    );
  }

  const config = STATUS_CONFIG[build.status];
  const StatusIcon = config.icon;

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-grid">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block mb-4 text-xs text-muted-foreground/50 hover:text-neon transition-colors"
          >
            <ArrowLeft className="w-3 h-3 inline mr-1" />
            Back to gallery
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-gradient">launchpad</span>
          </h1>
        </div>

        {/* Build Card */}
        <div className="card-glow p-6 space-y-6">
          {/* Status bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`pulse-dot ${config.bgColor} ${
                  config.pulse ? "" : "!animation-none"
                }`}
                style={config.pulse ? undefined : { animation: "none" }}
              />
              <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
            {(build.status === "queued" || build.status === "building") && (
              <span className="text-sm font-mono text-muted-foreground/60">
                {formatTime(elapsed)}
              </span>
            )}
          </div>

          {/* Build info */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground/50 uppercase tracking-wider font-mono mb-1.5">
                Prompt
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {build.prompt}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground/50 uppercase tracking-wider font-mono mb-1.5">
                App Slug
              </p>
              <p className="text-sm font-mono text-neon">{build.slug}</p>
            </div>
          </div>

          {/* Status-specific content */}
          {build.status === "queued" && (
            <div className="terminal-block space-y-1.5">
              <p>
                <span className="text-neon">$</span> Waiting for GitHub Actions
                runner...
              </p>
              <p className="text-muted-foreground/40">
                This can take 30-60 seconds to start.
              </p>
            </div>
          )}

          {build.status === "building" && (
            <div className="terminal-block space-y-1.5">
              <p>
                <span className="text-neon">$</span> Claude Code is building
                your app...
              </p>
              <p className="text-muted-foreground/40">
                Scaffolding, designing, configuring, deploying.
              </p>
              <p className="text-muted-foreground/40">
                Usually takes 5-15 minutes.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <StatusIcon className="w-3 h-3 text-neon animate-spin" />
                <span className="text-neon/60">working</span>
              </div>
            </div>
          )}

          {build.status === "complete" && build.netlifyUrl && (
            <div className="space-y-4">
              <div className="rounded-lg bg-success/5 border border-success/20 p-5 text-center">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-sm text-success mb-3">Your app is live!</p>
                <a
                  href={build.netlifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-mono text-success hover:underline"
                >
                  {build.netlifyUrl}
                </a>
              </div>
              <div className="flex gap-3">
                <a
                  href={build.netlifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-neon flex-1 justify-center"
                >
                  Open App
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Link href="/console" className="btn-ghost flex-1 justify-center">
                  <Rocket className="w-4 h-4" />
                  Build Another
                </Link>
              </div>
            </div>
          )}

          {build.status === "failed" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-5">
                <XCircle className="w-6 h-6 text-destructive mb-2" />
                <p className="text-sm text-destructive/80">
                  {build.error ||
                    "Build failed. Check GitHub Actions logs for details."}
                </p>
              </div>
              <Link href="/console" className="btn-ghost w-full justify-center">
                <ArrowLeft className="w-4 h-4" />
                Try Again
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
