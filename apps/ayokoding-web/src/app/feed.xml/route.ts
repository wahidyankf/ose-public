import { getContentIndex } from "@/server/content/index";

export const dynamic = "force-static";

export async function GET() {
  const index = await getContentIndex();
  const items: string[] = [];

  for (const [, meta] of index.contentMap) {
    if (meta.isSection || meta.locale !== "en") continue;
    items.push(`
    <item>
      <title><![CDATA[${meta.title}]]></title>
      <link>https://ayokoding.com/${meta.locale}/${meta.slug}</link>
      <guid>https://ayokoding.com/${meta.locale}/${meta.slug}</guid>
      ${meta.date ? `<pubDate>${new Date(meta.date).toUTCString()}</pubDate>` : ""}
      ${meta.description ? `<description><![CDATA[${meta.description}]]></description>` : ""}
    </item>`);
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AyoKoding</title>
    <link>https://ayokoding.com</link>
    <description>Bilingual educational platform for software engineering</description>
    <language>en</language>
    <atom:link href="https://ayokoding.com/feed.xml" rel="self" type="application/rss+xml"/>
    ${items.join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
