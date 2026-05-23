import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: APP_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/explore`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${APP_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${APP_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];
}
