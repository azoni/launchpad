import { ImageResponse } from "next/og";
import { CATALOG } from "@/data/catalog";

export const alt = "MacroMarket — The cheapest protein, ranked by dollars per gram";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const count = CATALOG.length;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#faf7f1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#567b45",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#faf7f1",
              fontSize: 64,
              fontWeight: 800,
            }}
          >
            $
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#2c2418" }}>
            MacroMarket
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 40, fontSize: 72, fontWeight: 800, color: "#2c2418" }}>
          The cheapest protein,
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color: "#567b45" }}>
          ranked by the dollar per gram.
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#8b7b65" }}>
          Whey · bars · jerky · canned fish · chicken · eggs · lentils
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            alignSelf: "flex-start",
            background: "#c26a45",
            borderRadius: 12,
            padding: "12px 24px",
            fontSize: 28,
            fontWeight: 700,
            color: "#ffffff",
          }}
        >
          {count} foods ranked · free protein calculator
        </div>
      </div>
    ),
    { ...size },
  );
}
