import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { ensureCatalog } from "@/lib/catalog/seed";
import { getPulse } from "@/lib/ingest/pulse";
import { SITE, absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sql = await getSql();
        await ensureCatalog(sql);
        const pulse = await getPulse(sql);
        const items = (pulse.changelog ?? [])
          .slice(0, 24)
          .map((c) => {
            const link = absoluteUrl(`/e/${encodeURIComponent(c.entityId)}`);
            return `<item>
  <title>${esc(c.title)}</title>
  <link>${link}</link>
  <guid isPermaLink="false">${esc(c.entityId)}-${esc(c.at)}</guid>
  <pubDate>${new Date(c.at).toUTCString()}</pubDate>
  <description>${esc(c.body)}</description>
</item>`;
          })
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${SITE.name} — receipts</title>
  <link>${SITE.url}/</link>
  <description>${esc(SITE.description)}</description>
  ${items}
</channel>
</rss>`;
        return new Response(xml, {
          headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=300" },
        });
      },
    },
  },
});

function esc(s: string): string {
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}
