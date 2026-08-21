import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboard } from "@/lib/server/queries";
import { SITE } from "@/lib/site";
import { WEEK_LETTER } from "@/lib/catalog/ira";

export const Route = createFileRoute("/week")({
  loader: () => getDashboard({ data: { window: "7d" } }),
  head: () => ({
    meta: [
      { title: `${WEEK_LETTER.title} · ${SITE.name}` },
      { name: "description", content: `${WEEK_LETTER.dek} Signed by ${SITE.editor}.` },
    ],
  }),
  component: Week,
});

function Week() {
  const data = Route.useLoaderData();
  const paras = WEEK_LETTER.body.split("\n\n");
  return (
    <article className="mx-auto max-w-2xl">
      <header className="mb-10 border-b border-border pb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">
          This week · {WEEK_LETTER.weekOf}
        </p>
        <h1 className="mt-2 font-display text-4xl italic tracking-tight">{WEEK_LETTER.title}</h1>
        <p className="mt-3 text-sm text-muted">{WEEK_LETTER.dek}</p>
        <p className="mt-4 text-xs text-subtle">
          {SITE.editor}, {SITE.editorTitle}
        </p>
      </header>

      <div className="space-y-4 text-sm leading-relaxed text-muted">
        {paras.map((p) => (
          <p key={p.slice(0, 40)} className={p.startsWith("—") ? "text-fg" : undefined}>
            {p}
          </p>
        ))}
      </div>

      <section className="mt-14">
        <h2 className="font-display text-3xl italic">Receipts</h2>
        <ol className="mt-6 space-y-6">
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
      </section>
      <p className="mt-10 text-xs text-subtle">
        <a href="/week.md" className="hover:text-fg">
          Markdown
        </a>
        {" · "}
        <a href="/feed.xml" className="hover:text-fg">
          RSS
        </a>
        {" · "}
        <Link to="/distribute" className="hover:text-fg">
          Distribute
        </Link>
        {" · "}
        <Link to="/refusals" className="hover:text-fg">
          Kill-list
        </Link>
        {" · "}
        <Link to="/ira" className="hover:text-fg">
          Masthead
        </Link>
      </p>
    </article>
  );
}
