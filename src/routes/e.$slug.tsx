import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink } from "lucide-react";
import { getEntity } from "@/lib/server/queries";
import { KIND_LABEL, LICENSE_LABEL } from "@/lib/catalog/types";
import { Lettermark } from "@/components/aether/mark";
import { Delta } from "@/components/aether/delta";
import { SignalList } from "@/components/aether/signals";
import { EntityCard } from "@/components/aether/entity-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { atStamp } from "@/lib/utils";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/e/$slug")({
  loader: async ({ params }) => {
    const data = await getEntity({ data: { id: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const e = loaderData?.entity;
    if (!e) return { meta: [{ title: SITE.name }] };
    const title = `${e.name} · ${SITE.name}`;
    const desc = `${e.tagline} Verified ${e.verifiedAt?.slice(0, 10) ?? "—"}. Map prior ${e.catalogWeight}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: EntityPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="font-display text-3xl italic">Not in the atlas.</h1>
      <p className="mt-2 text-sm text-muted">That entity is not tracked yet.</p>
      <Link to="/atlas" className="mt-6 inline-block text-sm text-accent">
        Back to atlas
      </Link>
    </div>
  ),
});

function EntityPage() {
  const { entity, signals, related, snapshots, uses, usedBy, changelog } = Route.useLoaderData();
  const chart = snapshots.map((s) => ({
    t: atStamp(s.at, 10),
    mentions: s.mentions,
    rank: s.rank,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-start">
        <Lettermark name={entity.name} kind={entity.kind} className="size-14 text-sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle">
            {KIND_LABEL[entity.kind]} · {LICENSE_LABEL[entity.license]}
            {entity.vendor ? ` · ${entity.vendor}` : ""}
            {entity.status !== "active" ? ` · ${entity.status}` : ""}
          </p>
          <h1 className="mt-1 font-display text-4xl italic tracking-tight">{entity.name}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{entity.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {entity.website ? (
              <Button asChild variant="secondary" size="sm">
                <a href={entity.website} target="_blank" rel="noreferrer">
                  Site <ExternalLink />
                </a>
              </Button>
            ) : null}
            {entity.github ? (
              <Button asChild variant="outline" size="sm">
                <a href={entity.github} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </Button>
            ) : null}
            {entity.paperUrl ? (
              <Button asChild variant="outline" size="sm">
                <a href={entity.paperUrl} target="_blank" rel="noreferrer">
                  Paper
                </a>
              </Button>
            ) : null}
            <Button asChild variant="ghost" size="sm">
              <Link to="/compare" search={{ ids: entity.id }}>
                Compare
              </Link>
            </Button>
          </div>
        </div>
        <div className="rounded-xl bg-surface p-4 text-right shadow-[var(--shadow-border)]">
          <p className="text-[11px] uppercase tracking-wide text-subtle">Map prior</p>
          <p className="mt-1 font-display text-4xl italic tabular">{entity.catalogWeight.toFixed(0)}</p>
          <p className="mt-1 text-xs text-muted">
            #{entity.kindRank || entity.rank} in {KIND_LABEL[entity.kind]}
          </p>
          <p className="mt-2 text-[11px] text-subtle">
            {entity.verifiedAt ? `Verified ${entity.verifiedAt.slice(0, 10)}` : "Unverified"}
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Meta label="Pricing" value={entity.pricing || "—"} />
        <Meta
          label="API"
          value={
            entity.spec.priceIn != null
              ? `$${entity.spec.priceIn} / $${entity.spec.priceOut ?? "—"} per 1M`
              : "unknown"
          }
        />
        <Meta
          label="Context"
          value={entity.spec.contextK ? `${entity.spec.contextK}K` : "unknown"}
        />
        <Meta
          label="Self-host"
          value={entity.spec.selfHost === true ? "Yes" : entity.spec.selfHost === false ? "No" : "unknown"}
        />
      </section>
      <section className="mt-4 grid gap-6 sm:grid-cols-3">
        <Meta label="Mentions 24h" value={String(entity.mentions24h)} />
        <Meta label="Mentions 7d" value={String(entity.mentions7d)} />
        <Meta label="Status" value={entity.status} />
      </section>

      {changelog?.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl italic">Changelog</h2>
          <ul className="divide-y divide-border rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
            {changelog.map((c) => (
              <li key={`${c.at}-${c.title}`} className="py-3">
                <p className="font-mono text-[11px] text-subtle">{c.at.slice(0, 10)}</p>
                <p className="mt-1 text-sm">{c.title}</p>
                <p className="mt-1 text-sm text-muted">{c.body}</p>
                {c.sourceUrl ? (
                  <a href={c.sourceUrl} className="mt-1 inline-block text-[11px] text-muted hover:text-fg" target="_blank" rel="noreferrer">
                    Receipt
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {chart.length ? (
      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl italic">Mention history</h2>
        <div className="h-56 rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <XAxis dataKey="t" hide />
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <RTooltip
                contentStyle={{
                  background: "#18181c",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="mentions" stroke="var(--color-accent)" strokeWidth={1.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      ) : null}

      {uses.length || usedBy.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl italic">Lineage</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {uses.length ? (
              <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">Built on</p>
                <ul className="mt-3 space-y-2">
                  {uses.map((e) => (
                    <li key={e.id}>
                      <Link to="/e/$slug" params={{ slug: e.id }} className="text-sm hover:text-accent">
                        {e.name}
                      </Link>
                      <span className="ml-2 text-[11px] text-subtle">{KIND_LABEL[e.kind]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {usedBy.length ? (
              <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">Ships in</p>
                <ul className="mt-3 space-y-2">
                  {usedBy.slice(0, 12).map((e) => (
                    <li key={e.id}>
                      <Link to="/e/$slug" params={{ slug: e.id }} className="text-sm hover:text-accent">
                        {e.name}
                      </Link>
                      <span className="ml-2 text-[11px] text-subtle">{KIND_LABEL[e.kind]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {entity.features.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl italic">Features</h2>
          <div className="flex flex-wrap gap-2">
            {entity.features.map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </section>
      ) : null}

      {entity.techniques.length ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl italic">Techniques in play</h2>
          <div className="flex flex-wrap gap-2">
            {entity.techniques.map((t) => (
              <Link key={t} to="/e/$slug" params={{ slug: t }}>
                <Badge variant="outline">{t}</Badge>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {entity.categories.length ? (
        <p className="mt-6 flex flex-wrap gap-2 text-xs text-subtle">
          {entity.categories.map((c) => (
            <Badge key={c} variant="outline">
              {c}
            </Badge>
          ))}
        </p>
      ) : null}

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-2xl italic">Linked signals</h2>
          <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
            <SignalList signals={signals} />
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-display text-2xl italic">Nearby in the atlas</h2>
          <div className="grid gap-3">
            {related.map((e) => (
              <EntityCard key={e.id} entity={e} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <p className="text-[11px] uppercase tracking-wide text-subtle">{label}</p>
      <p className="mt-1 text-sm text-fg">{value}</p>
    </div>
  );
}
