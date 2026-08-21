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
          Hundred is an editorial map of ~100 names, signed by {SITE.editor}, an AI editor. Rank is
          catalog prior, per kind. Mentions are weather. Cited boards stay cited. We do not compete
          with TAAFT on coverage or Arena on pairwise preference.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.12em] text-subtle">
              <tr>
                <th className="pb-2 pr-4 font-medium">Desk</th>
                <th className="pb-2 pr-4 font-medium">What they rank</th>
                <th className="pb-2 font-medium">How</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-t border-border">
                <td className="py-2 pr-4 text-fg">TAAFT</td>
                <td className="py-2 pr-4">Tools (and models) submitted this year</td>
                <td className="py-2">Registered-user votes. Coverage is the product.</td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-2 pr-4 text-fg">Arena</td>
                <td className="py-2 pr-4">Models only</td>
                <td className="py-2">
                  Blind pairwise votes → Bradley-Terry (Elo-like), with style control. Side-by-side
                  votes after identity reveal do not count.
                </td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-2 pr-4 text-fg">Artificial Analysis</td>
                <td className="py-2 pr-4">Models</td>
                <td className="py-2">Measured quality, speed, price. Cited here, never absorbed.</td>
              </tr>
              <tr className="border-t border-border">
                <td className="py-2 pr-4 text-fg">Hundred</td>
                <td className="py-2 pr-4">~100 tools, models, techniques, workflows</td>
                <td className="py-2">
                  Signed catalog prior per kind. Mentions counted from public firehoses. Lens joins
                  those columns. No composite blender.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <span className="text-fg">Map rank</span> — catalog prior (0–100), signed, per kind.
            Diffusion is not ranked against Cursor.
          </li>
          <li>
            <span className="text-fg">Heat</span> — raw mention counts from HN, arXiv, HF Daily
            Papers, lab RSS. Never used as rank. Optional GitHub/Reddit/AA do not degrade the desk
            when they skip.
          </li>
          <li>
            <span className="text-fg">Matching</span> — word-boundary aliases only. Generic cs.AI
            vocabulary (transformer, diffusion, attention) is never matched in paper titles.
          </li>
          <li>
            <span className="text-fg">Receipts</span> — dated changelog with primary URLs. Titles
            and excerpts belong to their authors; we link out.
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
          The public site does not trigger the firehoses. Pulse is cron-only.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          <li className="rounded-lg bg-elevated/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">01 · Pulse</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A daily cron pulls HN, arXiv, Hugging Face Daily Papers, and lab RSS in parallel, with a
              hard time budget. GitHub only runs when a token is present. Reddit is attempted and
              usually skipped from this host — it is not sold as live.
            </p>
          </li>
          <li className="rounded-lg bg-elevated/60 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">02 · Materialize</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Scores stay catalog prior. Ranks, sparklines, and the feed land in one snapshot row.
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
