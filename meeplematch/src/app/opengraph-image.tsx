import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MeepleMatch — Find your next board game in 60 seconds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #FFF8ED 0%, #F0DCC0 100%)",
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
        {/* Border frame */}
        <div
          style={{
            position: "absolute",
            inset: "20px",
            border: "4px solid #D4A574",
            borderRadius: "24px",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#FF6B35",
              letterSpacing: "-0.02em",
            }}
          >
            MeepleMatch
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#2D1B00",
              maxWidth: "700px",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            Find your next favorite board game in 60 seconds
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {["🎲", "♟️", "🃏", "🎯", "🏆"].map((emoji, i) => (
              <div
                key={i}
                style={{
                  fontSize: 40,
                  background: "white",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  border: "3px solid #D4A574",
                  boxShadow: "3px 3px 0px #D4A574",
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
