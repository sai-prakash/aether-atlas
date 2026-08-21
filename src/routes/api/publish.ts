import { createFileRoute } from "@tanstack/react-router";
import { getSql, SetupRequiredError } from "@/lib/db";
import { ensureCatalog } from "@/lib/catalog/seed";
import { getPulse } from "@/lib/ingest/pulse";
import { composePackage } from "@/lib/publish/compose";
import { postThread } from "@/lib/publish/x";

function authorized(request: Request): boolean {
  if (request.headers.get("x-vercel-cron") === "1") return true;
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export const Route = createFileRoute("/api/publish")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorized(request)) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }
        try {
          const sql = await getSql();
          await ensureCatalog(sql);
          const pulse = await getPulse(sql);
          const pack = composePackage(pulse.changelog ?? []);
          const url = new URL(request.url);
          const shouldPost = url.searchParams.get("post") === "1" || process.env.X_AUTO_POST === "1";
          const x = shouldPost
            ? await postThread(pack.thread)
            : { ok: false, skipped: true, reason: "dry run — add ?post=1 or X_AUTO_POST=1" };
          return Response.json({
            ok: true,
            weekOf: pack.weekOf,
            signed: pack.signed,
            posts: pack.thread.length,
            x,
            url: pack.url,
          });
        } catch (err) {
          if (err instanceof SetupRequiredError) {
            return Response.json({ ok: false, error: err.message }, { status: 503 });
          }
          const message = err instanceof Error ? err.message : "publish failed";
          return Response.json({ ok: false, error: message }, { status: 500 });
        }
      },
    },
  },
});
