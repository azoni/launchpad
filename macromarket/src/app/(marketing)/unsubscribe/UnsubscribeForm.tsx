"use client";

import { useState } from "react";

export function UnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "unsubscribe" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-lg border border-line bg-secondary px-4 py-3 text-sm font-semibold text-[color:var(--color-leaf-deep)]">
        Done — you won&apos;t get any more emails from us.
      </p>
    );
  }

  return (
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
        className="btn-soft shrink-0 px-4 py-2 text-sm disabled:opacity-50"
      >
        {state === "busy" ? "…" : "Unsubscribe"}
      </button>
      {state === "error" && (
        <p className="mt-2 text-xs text-[color:var(--color-berry)]">
          Couldn&apos;t process that — check the email and try again.
        </p>
      )}
    </form>
  );
}
