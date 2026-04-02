import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      { userAgent: "Claude-SearchBot", allow: "/" },
      { userAgent: "Claude-User", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: "https://blackdiamond-alpine-wash.netlify.app/sitemap.xml",
  };
}
