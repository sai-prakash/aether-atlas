import { createFileRoute } from "@tanstack/react-router";
import { listEntities } from "@/lib/server/queries";
import { KIND_LABEL } from "@/lib/catalog/types";
import { EntityCard } from "@/components/aether/entity-row";
import { CostLedger } from "@/components/aether/cost-ledger";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/methods")({
  loader: async () => {
    const all = await listEntities({ data: {} });
    return {
      techniques: all.filter((e) => e.kind === "technique"),
      workflows: all.filter((e) => e.kind === "workflow"),
      protocols: all.filter((e) => e.kind === "protocol"),
    };
  },
  component: Methods,
});

function Methods() {
  const { techniques, workflows, protocols } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Methods</p>
        <h1 className="mt-2 font-display text-4xl italic">How the work is done.</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Techniques, protocols, and production workflows — the patterns behind the tools, not just the logos.
        </p>
      </header>

      <section className="mb-12 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Methodology</p>
        <h2 className="mt-2 font-display text-2xl italic">Put a name on the rank.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Hundred is an editorial map of ~100 names, re-verified with dates. It is not a live composite
          index and does not compete with TAAFT on coverage or Artificial Analysis on measurement.
        </p>
        <p className="mt-3 text-sm text-muted">
          Brand: <span className="text-fg">{SITE.longName}</span>. Buy{" "}
          <span className="font-mono text-xs text-fg">{SITE.domains.primary}</span> first, then{" "}
          <span className="font-mono text-xs text-fg">{SITE.domains.backup}</span>. Do not buy{" "}
          <span className="font-mono text-xs">{SITE.domains.avoid}</span> (HundrED, education). Set{" "}
          <span className="font-mono text-xs">SITE_URL</span> and{" "}
          <span className="font-mono text-xs">EDITOR_NAME</span> after.
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <span className="text-fg">Map rank</span> — catalog prior (0–100), signed, per kind. Diffusion
            is not ranked against Cursor.
          </li>
          <li>
            <span className="text-fg">Heat</span> — raw 7-day mention counts. If fewer than three core
            firehoses return rows, heat is not used as a ranking signal and the desk says index degraded.
          </li>
          <li>
            <span className="text-fg">Matching</span> — word-boundary aliases only. Generic cs.AI
            vocabulary (transformer, diffusion, attention…) is never matched in paper titles.
          </li>
          <li>
            <span className="text-fg">Receipts</span> — dated changelog. Cited boards stay labeled.
            <a className="ml-2 text-fg underline" href="/api/atlas.json">
              JSON
            </a>
            {" · "}
            <a className="text-fg underline" href="/feed.xml">
              RSS
            </a>
          </li>
        </ul>
      </section>

      <section className="mb-12 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Desk architecture</p>
        <h2 className="mt-2 font-display text-2xl italic">Pulse, cache, sleep.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Hundred is built to run on a free-tier host: one write a day, then a sleeping database.
          Visitors never trigger the firehoses. The daily brief is on-demand and cached for 24 hours.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          <li className="rounded-lg bg-elevated/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">01 · Pulse</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A daily cron pulls HN, arXiv, Hugging Face, Reddit, and lab RSS in parallel, with a
              hard time budget. GitHub only runs when a token is present.
            </p>
          </li>
          <li className="rounded-lg bg-elevated/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">02 · Materialize</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Scores, ranks, sparklines, and the feed land in one snapshot row. Old signals and
              history are pruned so storage stays bounded.
            </p>
          </li>
          <li className="rounded-lg bg-elevated/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">03 · Sleep</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Every page reads that snapshot — from warm memory, or one cheap lookup. The database
              can scale to zero between pulses.
            </p>
          </li>
        </ol>
        <CostLedger />
      </section>

      <section className="mb-12 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Lens</p>
        <h2 className="mt-2 font-display text-2xl italic">Cite, don’t absorb.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          TAAFT, Futurepedia, Artificial Analysis, Arena, and Hugging Face Daily Papers each own one
          column. Hundred does not scrape their catalogs or blend their numbers into a composite index.
          The daily pulse cites public firehoses (and Artificial Analysis if <span className="font-mono text-xs">AA_API_KEY</span>{" "}
          is set). The Lens then joins ranks they will not put on one page: catalog prior vs firehose
          vs papers vs evals, technique lineage, and open-vs-commercial displacement.
        </p>
      </section>

      {protocols.length ? (
        <section className="mb-10">
          <h2 className="mb-3 font-display text-2xl italic">{KIND_LABEL.protocol}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {protocols.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-3 font-display text-2xl italic">Workflows</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((e) => (
            <EntityCard key={e.id} entity={e} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl italic">Techniques</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {techniques.map((e) => (
            <EntityCard key={e.id} entity={e} />
          ))}
        </div>
      </section>
    </div>
  );
}
