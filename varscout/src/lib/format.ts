export function pct(x: number | null | undefined, digits = 1, signed = true): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "—";
  const s = (x * 100).toFixed(digits);
  return `${signed && x > 0 ? "+" : ""}${s}%`;
}

export function money(x: number | null | undefined): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  const sign = x < 0 ? "-" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}K`;
  return `${sign}$${a.toFixed(2)}`;
}

export function usd(x: number, digits = 2): string {
  return `$${x.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/** Prices span 0.0001 to 100,000 across the book, so significant digits beat fixed decimals. */
export function price(x: number): string {
  if (!Number.isFinite(x)) return "—";
  const a = Math.abs(x);
  const digits = a >= 1000 ? 2 : a >= 1 ? 4 : a >= 0.01 ? 5 : 7;
  return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits });
}

export function duration(days: number): string {
  if (!Number.isFinite(days)) return "never";
  const h = days * 24;
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${days.toFixed(1)}d`;
}

export function span(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

export function bps(x: number, digits = 1): string {
  return Number.isFinite(x) ? `${x.toFixed(digits)}bp` : "—";
}

export function ago(ms: number | null): string {
  if (!ms) return "never";
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${(s / 3600).toFixed(1)}h ago`;
}
