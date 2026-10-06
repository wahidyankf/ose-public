import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
