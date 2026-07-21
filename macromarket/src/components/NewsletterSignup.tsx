"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

/**
 * Email capture. Posts to /api/subscribe (Firestore). Email is the one channel
 * an algorithm can't take away, so this appears on the highest-traffic pages.
 */
export function NewsletterSignup({
  source = "home",
  compact = false,
}: {
  source?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) {
        setState("done");
        setEmail("");
      } else {
        setState("error");
        setMsg((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
      }
    } catch {
      setState("error");
      setMsg("Network error — try again.");
    }
  }

  if (state === "done") {
    return (
      <div
        className={`rounded-xl border border-line bg-secondary px-4 py-3 text-sm font-semibold text-[color:var(--color-leaf-deep)] ${
          compact ? "" : "text-center"
        }`}
      >
        ✅ You&apos;re in — the weekly protein deals digest is on its way.
      </div>
    );
  }

  return (
    <div className={compact ? "" : "rounded-xl border border-line bg-white p-5"}>
      {!compact && (
        <div className="mb-3 flex items-center gap-2">
          <Mail className="size-5 text-primary" />
          <h2 className="font-heading text-lg font-bold text-ink">
            Get the weekly protein deals digest
          </h2>
        </div>
      )}
      {!compact && (
        <p className="mb-3 text-sm text-muted-foreground">
          One email a week with the best-value protein picks and live price drops —
          no spam, unsubscribe anytime.
        </p>
      )}
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="btn-clay shrink-0 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {state === "busy" ? "…" : "Get deals"}
        </button>
      </form>
      {state === "error" && (
        <p className="mt-2 text-xs text-[color:var(--color-berry)]">{msg}</p>
      )}
    </div>
  );
}
