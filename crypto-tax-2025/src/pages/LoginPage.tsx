import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../lib/auth";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) nav("/", { replace: true });
  }, [user, loading, nav]);

  return (
    <div className="ledger-bg flex h-screen items-center justify-center">
      <div className="paper-card w-full max-w-md p-10">
        <div className="mb-2 flex items-center gap-3">
          <img src="/icon.svg" alt="Crypto Tax 2025 ledger icon" className="h-12 w-12" />
          <div>
            <div className="font-display text-2xl font-bold leading-tight text-[color:var(--color-ink)]">
              Crypto Tax
            </div>
            <div>
              <span className="stamp text-[11px]">Tax Year 2025</span>
            </div>
          </div>
        </div>
        <div className="my-5 border-t border-dashed border-[color:var(--color-rule)]" />
        <p className="mb-1 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">
          A personal reconstruction tool for messy 2025 crypto activity. Wallet-first imports,
          deterministic FIFO, audit-ready exports.
        </p>
        <p className="mb-6 text-[11px] uppercase tracking-[0.12em] text-[color:var(--color-ink-faint)]">
          Single user · Sign-in restricted
        </p>
        <Button
          className="w-full justify-center"
          onClick={async () => {
            try {
              setError(null);
              await signInWithGoogle();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          }}
        >
          Sign in with Google
        </Button>
        {error && (
          <div className="mt-3 text-xs text-[color:var(--color-rose)]">{error}</div>
        )}
        <div className="mt-6 border-t border-[color:var(--color-rule)] pt-3 text-center text-[10px] text-[color:var(--color-ink-faint)]">
          Built by{" "}
          <a
            href="https://azoni.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2"
          >
            azoni.ai
          </a>
        </div>
      </div>
    </div>
  );
}
