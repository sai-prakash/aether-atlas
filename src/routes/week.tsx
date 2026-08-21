import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboard } from "@/lib/server/queries";
import { SITE } from "@/lib/site";
import { WEEK_LETTER } from "@/lib/catalog/ira";

export const Route = createFileRoute("/week")({
  loader: () => getDashboard({ data: { window: "7d" } }),
  head: ({ loaderData }) => {
    const letter = loaderData?.iraDay?.letter;
    const title = letter?.title ?? WEEK_LETTER.title;
    const dek = letter?.dek ?? WEEK_LETTER.dek;
    return {
      meta: [
        { title: `${title} · ${SITE.name}` },
        { name: "description", content: `${dek} ${SITE.editor}.` },
      ],
    };
  },
  component: Week,
});

function Week() {
  const data = Route.useLoaderData();
  const machine = data.iraDay?.letter;
  const title = machine?.title ?? WEEK_LETTER.title;
  const dek = machine?.dek ?? WEEK_LETTER.dek;
  const paras = (machine?.body ?? WEEK_LETTER.body).split("\n\n");
  const when = data.iraDay?.day ?? WEEK_LETTER.weekOf;
  return (
    <article className="mx-auto max-w-xl">
      <header className="mb-10 border-b border-border pb-8">
        <p className="text-xs text-subtle">
          {machine ? "Machine letter" : "Founding letter"} · {when}
        </p>
        <h1 className="mt-2 font-display text-4xl italic tracking-tight">{title}</h1>
        <p className="mt-3 text-[15px] text-muted">{dek}</p>
        <p className="mt-4 text-xs text-subtle">
          {SITE.editor}, {SITE.editorTitle}
        </p>
      </header>

      <div className="space-y-4 text-[15px] leading-relaxed text-muted">
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
                className="mt-1 block font-display text-2xl italic hover:text-fg"
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
        <Link to="/ira" className="hover:text-fg">
          Founding letter
        </Link>
      </p>
    </article>
  );
}
