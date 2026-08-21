"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Flashes once when its value changes, so an update that lands while you are
 * looking elsewhere is noticed rather than silently replacing the old number.
 */
export function Live({ value, className = "" }: { value: string; className?: string }) {
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 900);
      return () => clearTimeout(t);
    }
  }, [value]);

  return <span className={`${className} ${flash ? "tick-flash" : ""}`}>{value}</span>;
}
