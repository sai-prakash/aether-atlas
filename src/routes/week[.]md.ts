import { createFileRoute } from "@tanstack/react-router";
import { getPublishPackage } from "@/lib/server/queries";

export const Route = createFileRoute("/week.md")({
  server: {
    handlers: {
      GET: async () => {
        const pack = await getPublishPackage();
        return new Response(pack.blogMarkdown, {
          headers: {
            "content-type": "text/markdown; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        });
      },
    },
  },
});
