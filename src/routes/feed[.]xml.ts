import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { ensureCatalog } from "@/lib/catalog/seed";
import { getPulse } from "@/lib/ingest/pulse";
import { composePackage } from "@/lib/publish/compose";
import { SITE, absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sql = await getSql();
        await ensureCatalog(sql);
        const pulse = await getPulse(sql);
        const pack = composePackage(pulse.changelog ?? []);
        const letterItem = `<item>
  <title>${esc(pack.title)}</title>
  <link>${absoluteUrl("/week")}</link>
  <guid isPermaLink="true">${absoluteUrl("/week")}#${esc(pack.weekOf)}</guid>
  <pubDate>${new Date(`${pack.weekOf}T08:00:00Z`).toUTCString()}</pubDate>
  <description>${esc(pack.dek)}</description>
</item>`;
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
  <title>${esc(SITE.name)} — ${esc(SITE.editor)}</title>
  <link>${SITE.url}/</link>
  <description>${esc(SITE.description)}</description>
  ${letterItem}
  ${items}
</channel>
</rss>`;
        return new Response(xml, {
          headers: {
            "content-type": "application/rss+xml; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});

function esc(s: string): string {
  const amp = "\u0026";
  return s.replace(/&/g, `${amp}amp;`).replace(/</g, `${amp}lt;`).replace(/>/g, `${amp}gt;`);
}
