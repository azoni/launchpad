import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Launchpad — Describe an app. Get a deployed URL.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0A0B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            display: "flex",
          }}
        />

        {/* Gradient glow */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            display: "flex",
          }}
        />

        {/* Terminal prompt icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: "16px solid #A78BFA",
              display: "flex",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#EDEDEF",
            letterSpacing: "-0.02em",
          }}
        >
          launchpad
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: "#71717A",
            marginTop: "16px",
          }}
        >
          Describe an app. Get a deployed URL.
        </div>
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "32px",
          }}
        >
          {["prompt", "build", "deploy"].map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.2)",
                fontSize: 14,
                color: "#A78BFA",
                fontFamily: "monospace",
              }}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
