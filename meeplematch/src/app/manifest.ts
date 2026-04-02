import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeepleMatch — Board Game Discovery",
    short_name: "MeepleMatch",
    description: "Find your next favorite board game in 60 seconds",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8ED",
    theme_color: "#FF6B35",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
