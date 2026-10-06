import { createTRPCContext } from "@/features/app-shell/shell/trpc-init";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { SITE_URL } from "@/lib/site-url";

export const dynamic = "force-static";

export async function GET() {
  const { contentService } = createTRPCContext();
  const index = await contentService.getIndex();
  const items: string[] = [];

  for (const [, meta] of index.contentMap) {
    if (meta.isSection || meta.locale !== "en") continue;
    const url = `${SITE_URL}${contentUrl(meta.locale as Locale, meta.slug)}`;
    items.push(`
    <item>
      <title><![CDATA[${meta.title}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      ${meta.date ? `<pubDate>${new Date(meta.date).toUTCString()}</pubDate>` : ""}
      ${meta.description ? `<description><![CDATA[${meta.description}]]></description>` : ""}
    </item>`);
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AyoKoding</title>
    <link>${SITE_URL}</link>
    <description>Bilingual educational platform for software engineering</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items.join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
