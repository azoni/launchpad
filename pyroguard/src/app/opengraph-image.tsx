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
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #0F172A 100%)",
          padding: "72px",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              background: "#0F172A",
              border: "4px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 56 }}>🔥</div>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -0.5 }}>PyroGuard</div>
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
