import type { ReactNode } from "react";
import type { CategorySlug } from "@/lib/catalog/types";

/**
 * Hand-drawn line-icon set — one glyph per category, in a single consistent
 * stroke style (24px grid, round caps, currentColor). Replaces emoji everywhere
 * so whole foods without a product photo (chicken, eggs, lentils, tofu, seafood)
 * still get a distinct, on-brand mark instead of one generic icon.
 */
const GLYPHS: Record<CategorySlug, ReactNode> = {
  // whey tub with lid + label line
  "whey-protein": (
    <>
      <rect x="6" y="8" width="12" height="12.5" rx="2" />
      <rect x="5.4" y="3.8" width="13.2" height="4.2" rx="1.6" />
      <path d="M9 13h6" />
    </>
  ),
  // sprout: stem + two leaves
  "plant-protein": (
    <>
      <path d="M12 21v-7.5" />
      <path d="M12 13.5c0-3.3-2.6-5.4-6-5.4 0 3.4 2.6 5.4 6 5.4Z" />
      <path d="M12 11.5c0-3.3 2.6-5.4 6-5.4 0 3.4-2.6 5.4-6 5.4Z" />
    </>
  ),
  // protein bar with score lines
  "protein-bars": (
    <>
      <rect x="3.5" y="9" width="17" height="6" rx="2" />
      <path d="M8.5 9v6M13 9v6" />
    </>
  ),
  // capped shake bottle
  "rtd-shakes": (
    <>
      <rect x="9.5" y="3" width="5" height="2.6" rx="1" />
      <path d="M9.3 8.2 9.6 5.6h4.8l.3 2.6" />
      <rect x="7.4" y="8" width="9.2" height="12.6" rx="2.4" />
      <path d="M8 13.2h8" />
    </>
  ),
  // folded jerky strip
  "jerky-meat-snacks": (
    <>
      <path d="M5 9.6c2.2-1.6 4-.4 5.5.4 1.9 1 3.6 1.2 5.5.2 1-.5 2-.6 3-.2v4.8c-2.2 1.6-4 .4-5.5-.4-1.9-1-3.6-1.2-5.5-.2-1 .5-2 .6-3 .2Z" />
      <path d="M9.4 12.4h.01M14 13.1h.01" />
    </>
  ),
  // canned fish tin (top view) + pull tab
  "canned-seafood": (
    <>
      <ellipse cx="12" cy="12" rx="8" ry="5" />
      <ellipse cx="12" cy="12" rx="5.2" ry="2.8" />
      <path d="M18.6 8.4 21 7" />
    </>
  ),
  // yogurt cup + spoon
  "greek-yogurt-cottage-cheese": (
    <>
      <path d="M6.6 8h9.8l-1 11.2a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9L6.6 8Z" />
      <path d="M6 8h11" />
      <path d="M19 4c1.4 0 1.4 3.2 0 3.2S17.6 4 19 4ZM18.6 7.2 16.6 14" />
    </>
  ),
  // sealed snack pouch (crimped top)
  "protein-cereal-snacks": (
    <>
      <path d="M7.6 7.6 8.8 4.6h6.4l1.2 3v11.8a1 1 0 0 1-1 1H8.6a1 1 0 0 1-1-1V7.6Z" />
      <path d="M7.6 7.6 9 9l1.5-1.4L12 9l1.5-1.4L15 9l1.4-1.4" />
    </>
  ),
  // nut butter jar with lid + label
  "nut-seed-butters": (
    <>
      <rect x="7" y="7.4" width="10" height="13.2" rx="2" />
      <rect x="7.6" y="3.8" width="8.8" height="3.6" rx="1.5" />
      <rect x="9" y="11" width="6" height="5.4" rx="1.2" />
    </>
  ),
  // drumstick: meat + bone knuckle
  "poultry-lean-meat": (
    <>
      <circle cx="14.2" cy="9.8" r="4.3" />
      <path d="M11.2 12.8 8.2 15.8" />
      <circle cx="6.9" cy="17.1" r="1.3" />
      <circle cx="8.7" cy="15.3" r="1.3" />
    </>
  ),
  // egg
  "eggs-dairy": (
    <path d="M12 3.5c-3.4 0-5.9 5.2-5.9 9.3a5.9 5.9 0 0 0 11.8 0c0-4.1-2.5-9.3-5.9-9.3Z" />
  ),
  // three beans
  "legumes-beans": (
    <>
      <ellipse cx="9" cy="9.6" rx="3.4" ry="2" transform="rotate(-35 9 9.6)" />
      <ellipse cx="14.6" cy="11.8" rx="3.4" ry="2" transform="rotate(-35 14.6 11.8)" />
      <ellipse cx="10.4" cy="15.4" rx="3.4" ry="2" transform="rotate(-35 10.4 15.4)" />
    </>
  ),
  // tofu block (isometric cube)
  "tofu-tempeh-soy": (
    <>
      <path d="M12 3.6 19 7.6v8L12 19.6 5 15.6v-8Z" />
      <path d="M5 7.6 12 11.6l7-4M12 11.6v8" />
    </>
  ),
  // fish
  "seafood-whole": (
    <>
      <path d="M3.5 12c3-4.8 9.4-4.8 12.4 0-3 4.8-9.4 4.8-12.4 0Z" />
      <path d="M15.9 12l4.6-3.3v6.6L15.9 12Z" />
      <path d="M6.8 10.8h.01" />
    </>
  ),
};

export function CategoryIcon({
  slug,
  className,
  strokeWidth = 1.7,
}: {
  slug: CategorySlug;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {GLYPHS[slug]}
    </svg>
  );
}
