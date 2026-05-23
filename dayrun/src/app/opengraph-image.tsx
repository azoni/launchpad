import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Daily — an opt-in calendar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "#F2EBDB",
          display: "flex",
          flexDirection: "column",
          padding: 80,
          color: "#1A2E2E",
          fontFamily: "Georgia, 'Fraunces', serif",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#8A8278",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          an opt-in calendar
        </div>

        {/* Hero */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 240,
                fontWeight: 500,
                letterSpacing: "-0.025em",
                lineHeight: 0.9,
                color: "#1A2E2E",
                display: "flex",
                alignItems: "baseline",
              }}
            >
              daily<span style={{ color: "#B65340" }}>.</span>
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#3F5050",
                maxWidth: 900,
                marginTop: 12,
                lineHeight: 1.35,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Sign in with Google. Sync your calendar. Decide event-by-event what the world sees.
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 20,
            borderTop: "1px solid rgba(26, 46, 46, 0.20)",
          }}
        >
          <span
            style={{
              fontSize: 20,
              color: "#3F5050",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            dayrun-app.netlify.app
          </span>
          <span
            style={{
              padding: "10px 18px",
              background: "#1A2E2E",
              color: "#F2EBDB",
              borderRadius: 999,
              fontSize: 18,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Make yours
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
