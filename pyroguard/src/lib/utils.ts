import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(ts: number | Date | undefined, short = false): string {
  if (!ts) return "—";
  const d = ts instanceof Date ? ts : new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return short
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function daysUntil(ts: number | Date | undefined): number {
  if (!ts) return Infinity;
  const d = ts instanceof Date ? ts : new Date(ts);
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function ageYears(installDate: number | Date | undefined): number {
  if (!installDate) return 0;
  const d = installDate instanceof Date ? installDate : new Date(installDate);
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}
