import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboard } from "@/lib/server/queries";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/week")({
  loader: () => getDashboard({ data: { window: "7d" } }),
  head: () => ({
    meta: [
      { title: `This week · ${SITE.name}` },
      {
        name: "description",
        content: `Dated receipts for the ${SITE.name} map, signed by ${SITE.editor}.`,
      },
    ],
  }),
  component: Week,
});

function Week() {
  const data = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">This week</p>
        <h1 className="mt-2 font-display text-4xl italic">Receipts.</h1>
        <p className="mt-3 text-sm text-muted">
          Signed by {SITE.editor}. Last verified {SITE.verifiedAsOf}. Rank is editorial. These rows
          are dates, not a live index.
        </p>
      </header>
      <ol className="space-y-6">
        {data.changelog.map((c, i) => (
          <li key={`${c.entityId}-${c.at}-${c.title}`}>
            <p className="font-mono text-[11px] text-subtle">
              {String(i + 1).padStart(2, "0")} · {c.at.slice(0, 10)}
            </p>
            <Link
              to="/e/$slug"
              params={{ slug: c.entityId }}
              className="mt-1 block font-display text-2xl italic hover:text-accent"
            >
              {c.title}
            </Link>
            <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            <p className="mt-2 text-xs text-subtle">
              {c.entityName}
              {c.sourceUrl ? (
                <>
                  {" · "}
                  <a href={c.sourceUrl} className="hover:text-fg" target="_blank" rel="noreferrer">
                    Receipt
                  </a>
                </>
              ) : null}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-xs text-subtle">
        <a href="/feed.xml" className="hover:text-fg">
          RSS
        </a>
        {" · "}
        <a href="/api/atlas.json" className="hover:text-fg">
          JSON
        </a>
      </p>
    </div>
  );
}
