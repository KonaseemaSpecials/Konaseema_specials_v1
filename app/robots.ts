import type { MetadataRoute } from "next";

const SITE_URL = "https://konaseemaspecials.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/checkout"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
