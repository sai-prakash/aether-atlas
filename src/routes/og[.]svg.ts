import { createFileRoute } from "@tanstack/react-router";
import { WEEK_LETTER } from "@/lib/catalog/ira";
import { SITE } from "@/lib/site";

const AMP = "\u0026";

function esc(s: string): string {
  return s
    .replace(/&/g, `${AMP}amp;`)
    .replace(/</g, `${AMP}lt;`)
    .replace(/>/g, `${AMP}gt;`)
    .replace(/"/g, `${AMP}quot;`);
}

export const Route = createFileRoute("/og.svg")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const title = url.searchParams.get("t") || WEEK_LETTER.title;
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#09090b"/>
  <text x="72" y="120" fill="#8a8680" font-family="Georgia, serif" font-size="22" letter-spacing="4">${esc(SITE.editor.toUpperCase())}</text>
  <text x="72" y="320" fill="#e8e4dc" font-family="Georgia, serif" font-size="52" font-style="italic">${esc(title.slice(0, 72))}</text>
  <text x="72" y="560" fill="#8a8680" font-family="Georgia, serif" font-size="22">${esc(SITE.name)} · ${esc(SITE.verifiedAsOf)}</text>
</svg>`;
        return new Response(svg, {
          headers: {
            "content-type": "image/svg+xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
