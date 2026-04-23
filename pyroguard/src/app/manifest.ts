import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PyroGuard — Fire/Life-Safety Inspection",
    short_name: "PyroGuard",
    description: "Device-level fire alarm and life-safety inspection, route management, and NFPA reports for inspection contractors.",
    start_url: "/app",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF9",
    theme_color: "#0F172A",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
