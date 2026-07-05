import { ImageResponse } from "next/og";
import { CATALOG } from "@/data/catalog";
import { CATEGORIES } from "@/lib/catalog/categories";
import { computeMetrics } from "@/lib/catalog/metrics";

export const alt = "Cheapest protein by category on MacroMarket";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#faf7f1";
const INK = "#2c2418";
const LEAF = "#567b45";
const CLAY = "#c26a45";
const LINE = "#ebe4d7";
const MUTED = "#8b7b65";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = CATEGORIES.find((c) => c.slug === slug);
  const name = cat?.name ?? "Protein";

  const best = CATALOG.filter((c) => c.category === slug)
    .map((s) => ({
      s,
      cpg: computeMetrics(s, s.priceCents).costPerGramProteinCents,
    }))
    .filter((x): x is { s: (typeof CATALOG)[number]; cpg: number } => x.cpg != null)
    .sort((a, b) => a.cpg - b.cpg)[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: PAPER,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: LEAF,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: PAPER,
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            $
          </div>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: INK }}>
            MacroMarket
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", fontSize: 30, color: CLAY, fontWeight: 700 }}>
            Cheapest by the dollar per gram of protein
          </div>
          <div
            style={{
              display: "flex",
              fontSize: name.length > 26 ? 68 : 84,
              fontWeight: 800,
              color: INK,
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
        </div>

        {best ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "20px 30px",
              borderRadius: 18,
              background: "#ffffff",
              border: `2px solid ${LINE}`,
              alignSelf: "flex-start",
            }}
          >
            <div style={{ display: "flex", fontSize: 26, color: MUTED, fontWeight: 600 }}>
              Best value:
            </div>
            <div style={{ display: "flex", fontSize: 30, color: INK, fontWeight: 800 }}>
              {best.s.name}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: LEAF, fontWeight: 800 }}>
              ${(best.cpg / 100).toFixed(3)}/g
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 28, color: MUTED }}>
            Ranked by value on MacroMarket
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
