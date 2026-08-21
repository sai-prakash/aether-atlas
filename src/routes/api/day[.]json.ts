import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { ensureCatalog } from "@/lib/catalog/seed";
import { getIraDay, listIraDays } from "@/lib/ira/close";

export const Route = createFileRoute("/api/day.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sql = await getSql();
        await ensureCatalog(sql);
        const day = new URL(request.url).searchParams.get("d");
        if (day) {
          const row = await getIraDay(sql, day);
          if (!row) return Response.json({ error: "no snapshot that day — a hole, not zeros" }, { status: 404 });
          return Response.json(row, { headers: { "cache-control": "public, max-age=120", "access-control-allow-origin": "*" } });
        }
        const days = await listIraDays(sql, 30);
        return Response.json(
          { days: days.map((d) => ({ day: d.day, gap: d.gap, cores: d.cores, n: d.n })) },
          { headers: { "cache-control": "public, max-age=120", "access-control-allow-origin": "*" } },
        );
      },
    },
  },
});
