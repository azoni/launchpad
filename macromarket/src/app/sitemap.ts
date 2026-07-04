import type { MetadataRoute } from "next";
import { allSlugs } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/catalog/categories";
import { COMPARE_PAIRS, compareSlug } from "@/lib/catalog/compares";
import { APP_URL } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${APP_URL}${path}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: url("/deals"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/calculator"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: url("/coach"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: url("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: url("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: url("/disclosure"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: url("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categories: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: url(`/category/${c.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const foods: MetadataRoute.Sitemap = allSlugs().map((slug) => ({
    url: url(`/food/${slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const compares: MetadataRoute.Sitemap = COMPARE_PAIRS.map((pair) => ({
    url: url(`/compare/${compareSlug(pair)}`),
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...categories, ...foods, ...compares];
}
