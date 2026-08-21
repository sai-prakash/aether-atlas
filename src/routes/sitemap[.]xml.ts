import { createFileRoute } from "@tanstack/react-router";
import { SEED } from "@/lib/catalog/seed-data";
import { SITE, absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const pages = ["/", "/week", "/atlas", "/rankings", "/lens", "/methods", "/signals", "/papers"];
        const urls = [
          ...pages.map((p) => loc(p, "weekly")),
          ...SEED.map((e) => loc(`/e/${e.id}`, "weekly")),
        ].join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});

function loc(path: string, changefreq: string): string {
  return `
  <url>
    <loc>${absoluteUrl(path)}</loc>
    <changefreq>${changefreq}</changefreq>
    <lastmod>${SITE.verifiedAsOf === "21 Aug 2026" ? "2026-08-21" : new Date().toISOString().slice(0, 10)}</lastmod>
  </url>`;
}
