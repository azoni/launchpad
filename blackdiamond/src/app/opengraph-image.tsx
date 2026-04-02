import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Black Diamond Alpine Wash — Professional Exterior Cleaning in Whitefish, MT";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1B1B1B 0%, #2D3436 60%, #4ECDC4 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Diamond accent */}
        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "60px",
            width: "60px",
            height: "60px",
            background: "#4ECDC4",
            transform: "rotate(45deg)",
            opacity: 0.3,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "40px",
            width: "40px",
            height: "40px",
            background: "#F7B731",
            transform: "rotate(45deg)",
            opacity: 0.2,
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* Diamond icon */}
          <div
            style={{
              width: "50px",
              height: "50px",
              background: "#4ECDC4",
              transform: "rotate(45deg)",
              borderRadius: "6px",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
            }}
          >
            Black Diamond
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: "#4ECDC4",
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
            }}
          >
            Alpine Wash
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: "rgba(255,255,255,0.7)",
              marginTop: "12px",
            }}
          >
            Professional Exterior Cleaning — Whitefish, Montana
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
