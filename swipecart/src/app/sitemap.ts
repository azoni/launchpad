import type { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://swipecart.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/board-games`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/swipe`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  let bundlePages: MetadataRoute.Sitemap = [];

  try {
    const productsSnap = await adminDb
      .collection(COLLECTIONS.products)
      .where("active", "==", true)
      .select("slug", "updatedAt")
      .get();

    productPages = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/board-games/${data.slug}`,
        lastModified: data.updatedAt?.toDate() ?? new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      };
    });

    const bundlesSnap = await adminDb
      .collection(COLLECTIONS.bundles)
      .select("slug", "createdAt")
      .limit(100)
      .get();

    bundlePages = bundlesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/bundle/${data.slug}`,
        lastModified: data.createdAt?.toDate() ?? new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      };
    });
  } catch {
    // Firestore may not be ready at build time
  }

  return [...staticPages, ...productPages, ...bundlePages];
}
