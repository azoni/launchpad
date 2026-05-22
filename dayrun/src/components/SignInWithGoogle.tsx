"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";

export function SignInWithGoogle({
  onSignedIn,
  label = "Sign in with Google",
  className = "btn-chunky text-lg",
}: {
  onSignedIn?: (accessToken: string | null) => void;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setLoading(true);
    setError(null);
    try {
      const { accessToken } = await signInWithGoogle();
      onSignedIn?.(accessToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handle}
        disabled={loading}
        className={className}
      >
        <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden>
          <path
            fill="#FFC107"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.27h2.9c1.7-1.56 2.69-3.87 2.69-6.63z"
          />
          <path
            fill="#FF3D00"
            d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.9-2.27c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.58-5.06-3.71H.95v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#4CAF50"
            d="M3.94 10.71A5.4 5.4 0 0 1 3.66 9c0-.6.1-1.18.28-1.71V4.96H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.04l2.99-2.33z"
          />
          <path
            fill="#1976D2"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 .95 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z"
          />
        </svg>
        {loading ? "Signing in…" : label}
      </button>
      {error && <p className="text-sm text-red-700 font-semibold">{error}</p>}
    </div>
  );
}
