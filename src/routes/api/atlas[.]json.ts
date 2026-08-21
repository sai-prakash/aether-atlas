import { createFileRoute } from "@tanstack/react-router";
import { getAtlasExport } from "@/lib/server/queries";

export const Route = createFileRoute("/api/atlas.json")({
  server: {
    handlers: {
      GET: async () => {
        const data = await getAtlasExport();
        return Response.json(data, {
          headers: {
            "cache-control": "public, max-age=300",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});
