import { ImageResponse } from "next/og";

export const alt = "MacroMarket — The cheapest protein, ranked by dollars per gram";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          background: "#f4f6f1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#12b76a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f1b14",
              fontSize: 64,
              fontWeight: 800,
              border: "4px solid #0f1b14",
            }}
          >
            $
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#0f1b14" }}>
            MacroMarket
          </div>
        </div>

        <div style={{ display: "flex", marginTop: 40, fontSize: 72, fontWeight: 800, color: "#0f1b14" }}>
          The cheapest protein,
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, color: "#12b76a" }}>
          ranked by the dollar per gram.
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#566b60" }}>
          Whey · bars · jerky · canned fish · chicken · eggs · lentils
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            alignSelf: "flex-start",
            background: "#f5a524",
            border: "3px solid #0f1b14",
            borderRadius: 12,
            padding: "10px 22px",
            fontSize: 28,
            fontWeight: 700,
            color: "#3a2a06",
          }}
        >
          146 foods ranked · free protein calculator
        </div>
      </div>
    ),
    { ...size },
  );
}
