import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily",
    short_name: "Daily",
    description: "An opt-in calendar.",
    start_url: "/",
    display: "standalone",
    background_color: "#F2EBDB",
    theme_color: "#1A2E2E",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
