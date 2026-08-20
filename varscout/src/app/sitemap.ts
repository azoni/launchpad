import type { MetadataRoute } from "next";
import { fetchSnapshotCached } from "@/lib/variational/api";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/markets`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/method`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // Only list markets with real liquidity — the long tail of near-dead listings
  // would dilute the sitemap with pages nobody should land on.
  try {
    const { markets } = await fetchSnapshotCached(3600);
    const tradeable = markets
      .filter((m) => m.vol24 >= 250_000)
      .sort((a, b) => b.vol24 - a.vol24)
      .map((m) => ({
        url: `${SITE_URL}/market/${m.ticker}`,
        lastModified: now,
        changeFrequency: "hourly" as const,
        priority: m.vol24 >= 5_000_000 ? 0.7 : 0.5,
      }));
    return [...core, ...tradeable];
  } catch {
    return core;
  }
}
