import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Black Diamond Alpine Wash — Exterior Cleaning",
    short_name: "Black Diamond",
    description:
      "Professional pressure washing, window cleaning, and roof cleaning in Whitefish, Montana.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F5F0",
    theme_color: "#1B1B1B",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
