import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Varscout — a funding carry screener for Variational Omni";

/**
 * Branded tearsheet card. Fonts are fetched from the Google Fonts static CDN at
 * build time; if that fails the card still renders with the default face rather
 * than failing the build, so a network hiccup can never block a deploy.
 */
async function loadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const serif = await loadFont(
    "https://fonts.gstatic.com/s/newsreader/v20/cY9qfjOCX1hbuyalUrK49dLac06G1ZGsZBtoBCzBDXXD9JVF438w-I_ADOxEPjCggA.ttf",
  );

  const fonts = serif
    ? [{ name: "Newsreader", data: serif, style: "normal" as const, weight: 500 as const }]
    : undefined;
  const serifFamily = serif ? "Newsreader" : "serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FAF8F3",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        {/* ledger ruling */}
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", top: 0, left: 0, right: 0 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ height: 63, borderBottom: "1px solid rgba(176,166,148,0.16)" }} />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 30, height: 30, borderRadius: 6, background: "#B4472E" }} />
            <div
              style={{
                fontSize: 25,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "#6B6459",
                fontWeight: 600,
              }}
            >
              Variational Omni · funding carry
            </div>
          </div>

          <div
            style={{
              fontFamily: serifFamily,
              fontSize: 92,
              lineHeight: 1.04,
              color: "#1A1A1A",
              marginTop: 34,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            One position, chosen from 540 markets.
          </div>

          <div style={{ fontSize: 30, lineHeight: 1.45, color: "#4A453D", marginTop: 28, maxWidth: 900 }}>
            Ranks every perpetual by carry net of the spread you actually pay at your size — using
            the venue&rsquo;s own tiered depth quotes.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "3px solid #B4472E",
            paddingTop: 26,
          }}
        >
          <div style={{ fontFamily: serifFamily, fontSize: 54, color: "#1A1A1A" }}>Varscout</div>
          <div style={{ display: "flex", gap: 44 }}>
            {[
              ["Carry", "net of spread"],
              ["Depth", "priced at size"],
              ["Persistence", "collected hourly"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 19, letterSpacing: 3, textTransform: "uppercase", color: "#6B6459" }}>
                  {k}
                </div>
                <div style={{ fontSize: 25, color: "#4A453D", marginTop: 7 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
