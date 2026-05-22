import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://dayrun-app.netlify.app";

export const APP_NAME = "DayRun";

export const APP_TAGLINE =
  "Your week, on display. Sign in, sync your Google Calendar, share what you're up to.";
