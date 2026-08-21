import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboard } from "@/lib/server/queries";
import type { TimeWindow } from "@/lib/catalog/types";
import { SOURCE_LABEL } from "@/lib/catalog/types";
import { formatRelative, windowLabel } from "@/lib/utils";
import { healthCopy, sourceBadge } from "@/lib/catalog/health";
import { WEEK_LETTER } from "@/lib/catalog/ira";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { window?: TimeWindow } => {
    if (s.window === "7d" || s.window === "30d" || s.window === "24h") return { window: s.window };
    return {};
  },
  loaderDeps: ({ search }) => ({ window: search.window ?? "24h" }),
  loader: ({ deps }) => getDashboard({ data: { window: deps.window } }),
  component: Observatory,
});

function Observatory() {
  const data = Route.useLoaderData();
  const { window: windowRaw } = Route.useSearch();
  const window = windowRaw ?? "24h";
  const health = data.health;
  const degraded = health.status !== "live";
  const day = data.iraDay;
  const headline = day?.letter.title ?? WEEK_LETTER.title;
  const dek = day?.letter.dek ?? WEEK_LETTER.body.split("\n\n")[0];
  const movers = degraded ? [] : data.movers.filter((m) => m.delta > 0).slice(0, 8);

  return (
    <div className="mx-auto max-w-xl">
      <header className="pb-8">
        <p className="text-xs text-subtle">
          {SITE.editor}
          {data.ingest.finishedAt ? ` · ${formatRelative(data.ingest.finishedAt)}` : ""}
        </p>
        <h1 className="mt-3 font-display text-[2.15rem] italic leading-[1.15] tracking-tight text-fg sm:text-5xl">
          {headline}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{dek}</p>
        <p className="mt-5 text-sm">
          <Link to="/week" className="text-fg underline decoration-border-strong underline-offset-4 hover:decoration-fg">
            Full letter
          </Link>
          <span className="mx-2 text-subtle">·</span>
          <Link to="/archive" className="text-muted hover:text-fg">
            Archive
          </Link>
          <span className="mx-2 text-subtle">·</span>
          <Link to="/lab" className="text-muted hover:text-fg">
            How it runs
          </Link>
        </p>
        {degraded ? (
          <p className="mt-5 text-sm leading-relaxed text-fg">{healthCopy(health)}</p>
        ) : null}
      </header>

      {movers.length ? (
        <section className="border-t border-border pt-8">
          <p className="text-xs text-subtle">Mentioned {windowLabel(window)} · not quality</p>
          <ol className="mt-4">
            {movers.map((m, i) => (
              <li key={m.entity.id} className="border-b border-border">
                <Link
                  to="/e/$slug"
                  params={{ slug: m.entity.id }}
                  className="flex min-h-12 items-baseline justify-between gap-4 py-3"
                >
                  <span className="flex min-w-0 items-baseline gap-3">
                    <span className="w-5 shrink-0 font-mono text-xs text-subtle">{i + 1}</span>
                    <span className="truncate text-[15px] text-fg">{m.entity.name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs tabular text-muted">{m.delta}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <footer className="mt-10 space-y-3 pb-4 text-xs leading-relaxed text-subtle">
        <p>
          {Object.keys(SOURCE_LABEL).map((s, i) => {
            const st = (data.ingest.sources ?? []).find((x) => x.source === s);
            const badge = sourceBadge(st);
            const n = badge === "ok" ? String(st?.count) : badge;
            return (
              <span key={s}>
                {i ? " · " : ""}
                {SOURCE_LABEL[s]} {n}
              </span>
            );
          })}
        </p>
        <p>
          Mentions are weather. Rank is catalog prior. A missing day is a hole.
          {" "}
          <Link to="/methods" className="text-muted hover:text-fg">
            Methods
          </Link>
        </p>
      </footer>
    </div>
  );
}
