import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PyroGuard — Fire/Life-Safety Inspection, Done Right";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #080c10 0%, #0d1420 55%, #080c10 100%)",
          padding: "72px",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="96" height="96" viewBox="0 0 512 512">
            <path
              d="M256 60 L60 420 H452 Z"
              fill="none"
              stroke="#FF4F00"
              strokeWidth="44"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M256 180 C 256 180 196 260 196 320 C 196 355 220 380 256 380 C 292 380 316 355 316 320 C 316 260 256 180 256 180 Z"
              fill="#FF4F00"
            />
          </svg>
          <div style={{ display: "flex", gap: 10, fontSize: 40, fontWeight: 700, letterSpacing: -0.5 }}>
            <span>PyroGuard</span>
            <span style={{ color: "#FF4F00" }}>AI</span>
          </div>
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1.02,
              maxWidth: 1000,
            }}
          >
            Fire/Life-Safety Inspection, Done Right.
          </div>
          <div style={{ fontSize: 28, color: "#94A3B8", maxWidth: 900 }}>
            Device-level inventory. Mobile-first. NFPA-ready PDF reports. AI that knows the code.
          </div>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 12,
              fontSize: 20,
              color: "#CBD5E1",
            }}
          >
            <span style={{ background: "#DC2626", color: "white", padding: "8px 16px", borderRadius: 999 }}>
              NFPA 72
            </span>
            <span style={{ background: "#2563EB", color: "white", padding: "8px 16px", borderRadius: 999 }}>
              NFPA 25
            </span>
            <span style={{ background: "#16A34A", color: "white", padding: "8px 16px", borderRadius: 999 }}>
              NFPA 10
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
