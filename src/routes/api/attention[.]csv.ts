import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { ensureCatalog } from "@/lib/catalog/seed";
import { listIraDays } from "@/lib/ira/close";

export const Route = createFileRoute("/api/attention.csv")({
  server: {
    handlers: {
      GET: async () => {
        const sql = await getSql();
        await ensureCatalog(sql);
        const days = await listIraDays(sql, 365);
        const header = "day,id,name,kind,mentions,prev,gap,cores\n";
        const lines: string[] = [];
        for (const d of days) {
          const rows = [...d.movers, ...d.fades];
          const seen = new Set<string>();
          for (const r of rows) {
            if (seen.has(r.id)) continue;
            seen.add(r.id);
            lines.push(
              [d.day, r.id, csv(r.name), r.kind, r.mentions, r.prev ?? "", d.gap ? 1 : 0, d.cores.live].join(","),
            );
          }
          if (!rows.length) {
            lines.push([d.day, "", "", "", "", "", d.gap ? 1 : 0, d.cores.live].join(","));
          }
        }
        return new Response(header + lines.join("\n") + "\n", {
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "cache-control": "public, max-age=300",
            "access-control-allow-origin": "*",
          },
        });
      },
    },
  },
});

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
