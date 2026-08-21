import { createFileRoute } from "@tanstack/react-router";
import { getLens } from "@/lib/server/queries";
import { DisagreementList, DisplacementList, LineageList } from "@/components/aether/lens-panels";
import { formatRelative } from "@/lib/utils";
import { SOURCE_LABEL } from "@/lib/catalog/types";

export const Route = createFileRoute("/lens")({
  loader: () => getLens(),
  component: LensPage,
});

function LensPage() {
  const data = Route.useLoaderData();
  const sources = data.ingest.sources ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 border-b border-border pb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Lens</p>
        <h1 className="mt-2 font-display text-4xl italic tracking-tight">Where the boards disagree.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Directories list tools. Eval sites score models. Paper feeds rank arXiv. None of them join
          those columns, put techniques at the centre, or show when open-source is catching a
          commercial name. Hundred cites their boards. It does not absorb them into one fake index.
        </p>
        <p className="mt-3 text-xs text-subtle">
          Snapshot {data.builtAt ? formatRelative(data.builtAt) : "seeded"}
          {sources.length
            ? ` · ${sources.filter((s) => s.ok).length}/${sources.length} sources (${sources
                .map((s) => SOURCE_LABEL[s.source] ?? s.source)
                .join(", ")})`
            : ""}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-2xl italic">Disagreement</h2>
          <p className="mb-4 max-w-md text-sm text-muted">
            Same entity, different ranks: catalog prior, firehose mentions, paper heat, and
            Artificial Analysis when a key is present.
          </p>
          <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
            <DisagreementList rows={data.disagreements} />
          </div>
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl italic">Technique gravity</h2>
          <p className="mb-4 max-w-md text-sm text-muted">
            Methods as the primary key. Models, tools, and labs hang off the technique they ship.
          </p>
          <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
            <LineageList rows={data.lineage} />
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-2xl italic">Open displacement</h2>
        <p className="mb-4 max-w-xl text-sm text-muted">
          Per category, the most-mentioned open-source name versus the most-mentioned commercial
          one. Positive delta means the open side is louder this week.
        </p>
        <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
          <DisplacementList rows={data.displacement} />
        </div>
      </section>
    </div>
  );
}
