import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "DayRun — your week, on display";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "linear-gradient(135deg, #FFF7EE 0%, #FFE5D2 60%, #FFD166 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: "#FF8A5C",
              border: "5px solid #0E1B2C",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "8px 8px 0 #0E1B2C",
              color: "white",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            D
          </div>
          <span style={{ fontSize: 48, fontWeight: 800, color: "#0E1B2C" }}>DayRun</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              lineHeight: 1,
              color: "#0E1B2C",
              maxWidth: 980,
            }}
          >
            Your week, on display.
          </div>
          <div style={{ fontSize: 32, color: "#6B5B47", maxWidth: 860 }}>
            Sign in with Google. Sync your calendar. Share what you&apos;re up to — event by event.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              padding: "10px 22px",
              background: "#6C5CE7",
              color: "white",
              border: "4px solid #0E1B2C",
              borderRadius: 999,
              fontSize: 28,
              fontWeight: 700,
              boxShadow: "5px 5px 0 #0E1B2C",
            }}
          >
            dayrun-app.netlify.app
          </span>
          <span style={{ fontSize: 24, color: "#6B5B47" }}>built by azoni.ai</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
