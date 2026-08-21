import { createFileRoute } from "@tanstack/react-router";
import { getPublishPackage } from "@/lib/server/queries";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/distribute")({
  loader: () => getPublishPackage(),
  head: () => ({
    meta: [
      { title: `Distribute · ${SITE.name}` },
      {
        name: "description",
        content: "Friday pipeline: X thread, blog markdown, RSS. Copy and post. X write is optional via X_ACCESS_TOKEN.",
      },
    ],
  }),
  component: Distribute,
});

function Distribute() {
  const pack = Route.useLoaderData();
  const thread = pack.thread.map((p) => p.text).join("\n\n—\n\n");
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Friday pipeline</p>
        <h1 className="mt-2 font-display text-4xl italic">Distribute.</h1>
        <p className="mt-3 text-sm text-muted">
          {pack.signed ? "Signed letter." : "Unsigned draft from receipts."} {SITE.editor} does not
          have an X write key on this desk unless X_ACCESS_TOKEN is set. Copy the thread. RSS and
          JSON already publish themselves.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="font-display text-2xl italic">{pack.title}</h2>
        <p className="mt-2 text-sm text-muted">{pack.dek}</p>
        <p className="mt-3 text-xs text-subtle">
          <a href="/week" className="hover:text-fg">
            Letter
          </a>
          {" · "}
          <a href="/week.md" className="hover:text-fg">
            Markdown
          </a>
          {" · "}
          <a href="/feed.xml" className="hover:text-fg">
            RSS
          </a>
          {" · "}
          <a href="/api/thread.json" className="hover:text-fg">
            thread.json
          </a>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl italic">X thread</h2>
        <ol className="mt-4 space-y-3">
          {pack.thread.map((p, i) => (
            <li key={p.text} className="rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <p className="font-mono text-[10px] text-subtle">
                {String(i + 1).padStart(2, "0")} · {p.text.length} chars
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{p.text}</p>
            </li>
          ))}
        </ol>
        <textarea
          readOnly
          value={thread}
          className="mt-4 h-40 w-full rounded-xl bg-elevated p-3 font-mono text-xs text-muted"
        />
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl italic">Dropped</h2>
        <ul className="mt-3 space-y-2">
          {pack.drops.map((d) => (
            <li key={d.id} className="text-sm text-muted">
              <span className="text-fg">{d.name}</span> — {d.why}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl italic">Blog markdown</h2>
        <textarea
          readOnly
          value={pack.blogMarkdown}
          className="mt-4 h-64 w-full rounded-xl bg-elevated p-3 font-mono text-xs text-muted"
        />
      </section>
    </div>
  );
}
