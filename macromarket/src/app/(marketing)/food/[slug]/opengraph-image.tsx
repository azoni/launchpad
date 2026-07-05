import { ImageResponse } from "next/og";
import { CATALOG } from "@/data/catalog";
import { CATEGORY_BY_SLUG } from "@/lib/catalog/categories";
import { computeMetrics } from "@/lib/catalog/metrics";

export const alt = "Protein value on MacroMarket";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette (globals.css)
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
  const seed = CATALOG.find((c) => c.id === slug);
  const name = seed?.name ?? "MacroMarket";
  const brand = seed?.brand ?? "";
  const catLabel = seed ? CATEGORY_BY_SLUG[seed.category]?.short ?? "" : "";
  const cpg = seed
    ? computeMetrics(seed, seed.priceCents).costPerGramProteinCents
    : null;
  const cpgStr = cpg != null ? `$${(cpg / 100).toFixed(3)}` : "—";

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
        {/* brand row */}
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
          {catLabel ? (
            <div
              style={{
                display: "flex",
                marginLeft: 8,
                padding: "6px 16px",
                borderRadius: 999,
                background: "#edf3e7",
                color: LEAF,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {catLabel}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>

        {/* product name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {brand ? (
            <div style={{ display: "flex", fontSize: 30, color: MUTED, fontWeight: 600 }}>
              {brand}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          <div
            style={{
              display: "flex",
              fontSize: name.length > 40 ? 60 : 74,
              fontWeight: 800,
              color: INK,
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>
        </div>

        {/* metric */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 14,
              padding: "22px 34px",
              borderRadius: 20,
              background: "#ffffff",
              border: `2px solid ${LINE}`,
            }}
          >
            <div style={{ display: "flex", fontSize: 88, fontWeight: 800, color: LEAF }}>
              {cpgStr}
            </div>
            <div style={{ display: "flex", fontSize: 30, fontWeight: 600, color: MUTED }}>
              per gram of protein
            </div>
          </div>
          <div
            style={{
              display: "flex",
              marginBottom: 10,
              fontSize: 26,
              fontWeight: 700,
              color: CLAY,
            }}
          >
            ranked by value
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
