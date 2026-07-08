import type { MetadataRoute } from "next";

const BASE = "https://pyroguard-demo.netlify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/standards`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
