import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DayRun",
    short_name: "DayRun",
    description: "Your week, on display.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF7EE",
    theme_color: "#FF8A5C",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
