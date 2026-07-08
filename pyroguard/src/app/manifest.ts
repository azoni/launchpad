import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PyroGuard — Fire/Life-Safety Operations Platform",
    short_name: "PyroGuard",
    description:
      "All-in-one operations platform for fire & life-safety inspection contractors — scheduling, field inspections, AHJ filing, quoting, and invoicing.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#080c10",
    theme_color: "#080c10",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
