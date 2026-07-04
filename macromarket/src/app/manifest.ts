import type { MetadataRoute } from "next";
import { APP_DESCRIPTION } from "@/lib/utils";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MacroMarket — The cheapest protein, ranked by dollars per gram",
    short_name: "MacroMarket",
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f1",
    theme_color: "#12b76a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
