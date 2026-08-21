import { createFileRoute, Link } from "@tanstack/react-router";
import { getDashboard } from "@/lib/server/queries";
import type { TimeWindow } from "@/lib/catalog/types";
import { CATEGORY_LABEL, LICENSE_LABEL, SOURCE_LABEL } from "@/lib/catalog/types";
import { formatCompact, formatRelative, windowLabel } from "@/lib/utils";
import { EntityRow } from "@/components/aether/entity-row";
import { SignalList } from "@/components/aether/signals";
import { WindowToggle } from "@/components/aether/window-toggle";
import { LiveActions } from "@/components/aether/live-actions";
import { Delta } from "@/components/aether/delta";
import { Badge } from "@/components/ui/badge";
import { WEIGHTS } from "@/lib/catalog/scoring";
import { CostTeaser } from "@/components/aether/cost-ledger";
import { DisagreementList, DisplacementList, LineageList } from "@/components/aether/lens-panels";

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
  const leadMover = data.movers[0];
  const okSources = (data.ingest.sources ?? []).filter((s) => s.ok).length;

  return (
    <div className="mx-auto max-w-6xl stagger-in">
      <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Observatory</p>
          <h1 className="mt-2 font-display text-4xl italic tracking-tight text-fg sm:text-5xl">
            What moved.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            A living atlas of AI — tools, models, papers, techniques, and workflows — ranked from
            public firehoses. One daily pulse writes the desk; every visit reads a cached snapshot.
            No paid APIs. Every number is sourced.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <WindowToggle value={window} />
          <LiveActions />
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Tracked" value={formatCompact(data.totals.entities)} hint="catalog entities" />
        <Stat label="Signals 24h" value={formatCompact(data.totals.signals24h)} hint="live mentions" />
        <Stat label="Open tools" value={formatCompact(data.totals.tools)} hint="products in atlas" />
        <Stat
          label="Last pulse"
          value={data.ingest.finishedAt ? formatRelative(data.ingest.finishedAt) : "seeded"}
          hint={
            data.ingest.sources.length
              ? `${okSources}/${data.ingest.sources.length} sources`
              : "daily cron · cached reads"
          }
        />
      </section>

      {leadMover ? (
        <section className="mt-6 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">Lead mover · {windowLabel(window)}</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <Link
              to="/e/$slug"
              params={{ slug: leadMover.entity.id }}
              className="font-display text-3xl italic tracking-tight hover:text-accent"
            >
              {leadMover.entity.name}
            </Link>
            <Delta value={leadMover.delta} className="text-sm" />
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{leadMover.entity.tagline}</p>
        </section>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl italic">Index</h2>
            <Link to="/rankings" className="text-xs text-muted hover:text-fg">
              Full board
            </Link>
          </div>
          <div className="rounded-xl bg-surface px-2 py-1 shadow-[var(--shadow-border)]">
            {data.leaders.slice(0, 12).map((e) => (
              <EntityRow key={e.id} entity={e} />
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-8">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-2xl italic">Live signals</h2>
              <Link to="/signals" className="text-xs text-muted hover:text-fg">
                Feed
              </Link>
            </div>
            <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
              <SignalList signals={data.signals.slice(0, 8)} compact />
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-display text-2xl italic">Gainers & fades</h2>
            <div className="grid gap-2">
              {data.movers.slice(0, 5).map((m) => (
                <Link
                  key={m.entity.id}
                  to="/e/$slug"
                  params={{ slug: m.entity.id }}
                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5 shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
                >
                  <span className="text-sm">{m.entity.name}</span>
                  <Delta value={m.delta} />
                </Link>
              ))}
              {data.losers.slice(0, 3).map((m) => (
                <Link
                  key={m.entity.id}
                  to="/e/$slug"
                  params={{ slug: m.entity.id }}
                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5 shadow-[var(--shadow-border)]"
                >
                  <span className="text-sm">{m.entity.name}</span>
                  <Delta value={m.delta} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl italic">Where they disagree</h2>
            <Link to="/lens" className="text-xs text-muted hover:text-fg">
              Lens
            </Link>
          </div>
          <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
            <DisagreementList rows={data.lens.disagreements} compact />
          </div>
        </div>
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl italic">Technique gravity</h2>
            <Link to="/lens" className="text-xs text-muted hover:text-fg">
              Lineage
            </Link>
          </div>
          <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
            <LineageList rows={data.lens.lineage} compact />
          </div>
        </div>
      </section>

      {data.lens.displacement.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl italic">Open displacement</h2>
          <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
            <DisplacementList rows={data.lens.displacement} compact />
          </div>
        </section>
      ) : null}

      {data.insight ? (
        <section className="mt-10 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            Brief · {formatRelative(data.insight.generatedAt)}
          </p>
          <h2 className="mt-2 font-display text-2xl italic">{data.insight.title}</h2>
          <article className="mt-3 max-w-3xl space-y-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {data.insight.body}
          </article>
        </section>
      ) : null}

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-2xl italic">By field</h2>
          <ul className="space-y-2">
            {data.byCategory.slice(0, 8).map((c) => (
              <li key={c.category} className="flex items-center gap-3">
                <span className="w-28 text-xs uppercase tracking-wide text-subtle">
                  {CATEGORY_LABEL[c.category] ?? c.category}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                  <span
                    className="block h-full rounded-full bg-accent/70"
                    style={{ width: `${Math.min(100, (c.avgScore / 100) * 100)}%` }}
                  />
                </span>
                <span className="tabular w-10 text-right text-xs text-muted">{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl italic">License split</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.licenseSplit.map((l) => (
              <div key={l.license} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-[11px] uppercase tracking-wide text-subtle">
                  {LICENSE_LABEL[l.license as keyof typeof LICENSE_LABEL] ?? l.license}
                </p>
                <p className="mt-2 font-display text-3xl italic tabular">{l.count}</p>
                <p className="text-xs text-muted">avg index {l.avgScore.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl italic">How the index is built</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Aether Index = {Math.round(WEIGHTS.catalog * 100)}% catalog prior (editorial weight from public
          2026 rankings) + {Math.round(WEIGHTS.mentions * 100)}% live mention velocity (HN, Reddit, RSS,
          arXiv titles) + {Math.round(WEIGHTS.social * 100)}% public social (GitHub stars / HF) +{" "}
          {Math.round(WEIGHTS.recency * 100)}% recency. The desk pulses once a day, materializes one
          snapshot, and sleeps — visitors never wake the firehoses. Discord is closed; X has no free
          firehose — those rooms are not silently faked. Sources that fail are marked failed, not guessed.{" "}
          <Link to="/methods" className="text-accent hover:underline">
            How the desk is hosted
          </Link>
          .
        </p>
        <CostTeaser />
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.keys(SOURCE_LABEL).map((s) => {
            const st = (data.ingest.sources ?? []).find((x) => x.source === s);
            return (
              <Badge key={s} variant={st?.ok ? "accent" : "outline"}>
                {SOURCE_LABEL[s]} {st ? (st.ok ? st.count : "fail") : "idle"}
              </Badge>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-[11px] uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-2 font-display text-3xl italic tabular leading-none">{value}</p>
      <p className="mt-2 text-xs text-muted">{hint}</p>
    </div>
  );
}
