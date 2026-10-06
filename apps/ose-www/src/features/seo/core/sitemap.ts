import type { MetadataRoute } from "next";
import type { ContentMeta } from "@/features/content/core/types";
import { SITE_URL } from "@/lib/site-url";

export function buildSitemapEntries(updates: ContentMeta[], now: Date = new Date()): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about/`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/updates/`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const updatePages: MetadataRoute.Sitemap = updates.map((update) => ({
    url: `${SITE_URL}/${update.slug}/`,
    lastModified: update.date ?? now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...updatePages];
}
