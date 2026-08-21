import { createFileRoute, Link } from "@tanstack/react-router";
import { getSignals, listEntities } from "@/lib/server/queries";
import { EntityCard } from "@/components/aether/entity-row";
import { SignalList } from "@/components/aether/signals";

export const Route = createFileRoute("/papers")({
  loader: async () => {
    const [canonical, live] = await Promise.all([
      listEntities({ data: { kind: "paper" } }),
      getSignals({ data: { source: "arxiv" } }),
    ]);
    return { canonical, live };
  },
  component: Papers,
});

function Papers() {
  const { canonical, live } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Papers</p>
        <h1 className="mt-2 font-display text-4xl italic">The record.</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Canonical papers that still structure the field, plus whatever arXiv is shipping today in cs.AI / LG / CL / CV.
        </p>
      </header>
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <h2 className="mb-3 font-display text-2xl italic">Canon</h2>
          <div className="grid gap-3">
            {canonical.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl italic">arXiv now</h2>
            <Link to="/signals" search={{ source: "arxiv" }} className="text-xs text-muted hover:text-fg">
              All arXiv signals
            </Link>
          </div>
          <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
            <SignalList signals={live} />
          </div>
        </div>
      </section>
    </div>
  );
}
