import { createFileRoute } from "@tanstack/react-router";
import { getSql, SetupRequiredError } from "@/lib/db";
import { ensureCatalog } from "@/lib/catalog/seed";
import { PULSE } from "@/lib/ingest/budget";
import { claimPulse, runIngest } from "@/lib/ingest/run";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export const Route = createFileRoute("/api/cron")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }
        try {
          const sql = await getSql();
          await ensureCatalog(sql);
          const claimed = await claimPulse(sql, PULSE.minCronMs);
          if (!claimed.ok) {
            return Response.json({
              ok: true,
              skipped: true,
              reason: claimed.reason,
              last: claimed.last,
            });
          }
          const result = await runIngest(sql, { runId: claimed.runId });
          return Response.json({ ok: true, skipped: false, ...result });
        } catch (err) {
          if (err instanceof SetupRequiredError) {
            return Response.json({ ok: false, error: err.message }, { status: 503 });
          }
          const message = err instanceof Error ? err.message : "cron failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
