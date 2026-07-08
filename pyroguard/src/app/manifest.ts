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
    // TODO(v2): generate /icon-192.png and /icon-512.png (never existed in v1) and redraw
    // icon.svg in the tactical palette — see REBUILD.md §5.
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
