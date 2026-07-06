import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const APP_NAME = "MacroMarket";
export const APP_SLUG = "macromarket";
export const APP_TAGLINE = "The best deals on protein.";
export const APP_DESCRIPTION =
  "MacroMarket finds the best deals on protein — powders, bars, snacks, and whole foods ranked by value (cost per gram of protein) so you get the most protein for your money. Compare whey, bars, jerky, canned fish, Greek yogurt, and whole foods like chicken, eggs, and lentils.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://macromarket-app.netlify.app";

/** Amazon Associates partner tag — shared across the launchpad. */
export const PARTNER_TAG = "macromarket-20";
