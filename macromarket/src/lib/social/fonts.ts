/**
 * Brand fonts for satori-rendered social cards (next/og ImageResponse).
 * Fetches TTF binaries from Google Fonts at runtime (satori cannot use woff2)
 * and caches them in module scope for the life of the lambda. Degrades to null
 * (system sans) if the fetch fails — a card is always produced.
 */

const cache = new Map<string, ArrayBuffer | null>();

async function loadGoogleFont(
  family: string,
  weight: number,
): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@${weight}`;
    // A non-browser UA makes Google serve truetype URLs instead of woff2.
    const css = await (
      await fetch(cssUrl, { headers: { "User-Agent": "curl/8" } })
    ).text();
    const url = css.match(/src:\s*url\((https:[^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) throw new Error("no ttf url in css");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`font fetch ${res.status}`);
    const buf = await res.arrayBuffer();
    cache.set(key, buf);
    return buf;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export interface CardFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700;
  style: "normal";
}

/** Fraunces (display) + DM Sans (body) — the site's brand pairing. */
export async function getCardFonts(): Promise<CardFont[]> {
  const [fraunces, dmMedium, dmBold] = await Promise.all([
    loadGoogleFont("Fraunces", 600),
    loadGoogleFont("DM Sans", 500),
    loadGoogleFont("DM Sans", 700),
  ]);
  const fonts: CardFont[] = [];
  if (fraunces) fonts.push({ name: "Fraunces", data: fraunces, weight: 600, style: "normal" });
  if (dmMedium) fonts.push({ name: "DM Sans", data: dmMedium, weight: 500, style: "normal" });
  if (dmBold) fonts.push({ name: "DM Sans", data: dmBold, weight: 700, style: "normal" });
  return fonts;
}

/** font-family helpers that fall back to sans when a fetch failed */
export const DISPLAY_FONT = "Fraunces, Georgia, serif";
export const BODY_FONT = "'DM Sans', sans-serif";
