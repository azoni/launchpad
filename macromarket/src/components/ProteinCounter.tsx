"use client";

import { useEffect, useState } from "react";

// Easy to reword — this is the label everyone will debate.
const SHORT = "protein → Amazon";
const FULL = "grams of protein readers have clicked through to buy on Amazon";

function formatG(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

export function ProteinCounter() {
  const [target, setTarget] = useState<number | null>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/protein-shopped")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setTarget(Math.max(0, Number(d?.grams) || 0));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (target == null) return;
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  if (target == null || target <= 0) return null;

  return (
    <div
      title={`${target.toLocaleString("en-US")} ${FULL}`}
      className="hidden shrink-0 items-center gap-1.5 rounded-full border border-line bg-secondary px-2.5 py-1 text-xs font-bold text-[color:var(--color-leaf-deep)] md:inline-flex"
    >
      <span className="size-1.5 rounded-full bg-[color:var(--color-leaf)]" />
      <span className="tabular">{formatG(display)}g</span>
      <span className="font-semibold text-muted-foreground">{SHORT}</span>
    </div>
  );
}
