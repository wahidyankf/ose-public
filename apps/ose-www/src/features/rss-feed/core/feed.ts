import type { ContentMeta } from "@/features/content/core/types";
import { SITE_URL } from "@/lib/site-url";

export function buildFeedResponse(updates: ContentMeta[]): Response {
  const items = updates
    .map((update) => {
      const date = update.date ? new Date(update.date).toUTCString() : "";
      return `    <item>
      <title><![CDATA[${update.title}]]></title>
      <link>${SITE_URL}/${update.slug}/</link>
      <guid>${SITE_URL}/${update.slug}/</guid>
      ${date ? `<pubDate>${date}</pubDate>` : ""}
      ${update.summary ? `<description><![CDATA[${update.summary}]]></description>` : ""}
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OSE Platform Updates</title>
    <link>${SITE_URL}/updates/</link>
    <description>Updates on the Open Sharia Enterprise Platform development</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
