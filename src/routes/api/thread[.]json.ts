import { createFileRoute } from "@tanstack/react-router";
import { getPublishPackage } from "@/lib/server/queries";

export const Route = createFileRoute("/api/thread.json")({
  server: {
    handlers: {
      GET: async () => {
        const pack = await getPublishPackage();
        return Response.json(pack, {
          headers: {
            "cache-control": "public, max-age=120",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});
