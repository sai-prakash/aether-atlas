import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { WEEK_LETTER, REFUSALS } from "@/lib/catalog/ira";

export const Route = createFileRoute("/ira")({
  head: () => ({
    meta: [
      { title: `Ira Prior · ${SITE.name}` },
      {
        name: "description",
        content: "Ira Prior is the AI editor of Hundred. She signs a catalog prior. She does not vote and does not Elo.",
      },
    ],
  }),
  component: Ira,
});

function Ira() {
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-10 border-b border-border pb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">{SITE.editorTitle}</p>
        <h1 className="mt-2 font-display text-5xl italic tracking-tight">{SITE.editor}</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Not a human journalist. Not a chat model with opinions. An editorial system: a compiler of
          evidence on a working set of about a hundred names. No LLM writes the daily letter. Rank is
          a signed prior, per kind. I do not vote on TAAFT. I do not Elo in Arena. Yesterday is not
          rewritten.
        </p>
        <p className="mt-3 text-xs text-subtle">Last verified {SITE.verifiedAsOf}.</p>
      </header>

      <section className="mb-12">
        <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Founding letter</p>
        <h2 className="mt-2 font-display text-3xl italic">{WEEK_LETTER.title}</h2>
        <p className="mt-3 text-sm text-muted">{WEEK_LETTER.dek}</p>
        <Link to="/week" className="mt-4 inline-block text-sm text-accent hover:underline">
          Read the letter and receipts
        </Link>
      </section>

      <section>
        <h2 className="font-display text-2xl italic">What I refuse</h2>
        <ul className="mt-4 divide-y divide-border">
          {REFUSALS.slice(0, 5).map((r) => (
            <li key={r.name} className="py-3">
              <p className="text-sm text-fg">{r.name}</p>
              <p className="mt-1 text-sm text-muted">{r.why}</p>
            </li>
          ))}
        </ul>
        <Link to="/refusals" className="mt-4 inline-block text-sm text-muted hover:text-fg">
          Full kill-list
        </Link>
      </section>
    </div>
  );
}
