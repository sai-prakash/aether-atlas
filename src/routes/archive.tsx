import { createFileRoute, Link } from "@tanstack/react-router";
import { getArchiveDays } from "@/lib/server/queries";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/archive")({
  loader: () => getArchiveDays(),
  head: () => ({
    meta: [
      { title: `Archive · ${SITE.name}` },
      { name: "description", content: "Append-only attention days. Missing dates are holes, not zeros." },
    ],
  }),
  component: Archive,
});

function Archive() {
  const { days } = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Dataset</p>
        <h1 className="mt-2 font-display text-4xl italic">Attention days.</h1>
        <p className="mt-3 text-sm text-muted">
          One row per UTC day. Mentions, not quality. A missing date is a gap — never filled forward.
          {" "}
          <a href="/api/attention.csv" className="text-accent hover:underline">
            CSV
          </a>
          {" · "}
          <a href="/api/day.json" className="text-accent hover:underline">
            JSON
          </a>
        </p>
      </header>
      {days.length === 0 ? (
        <p className="text-sm text-muted">No days closed yet. The next pulse writes the first file.</p>
      ) : (
        <ol className="space-y-4">
          {days.map((d) => (
            <li key={d.day} className="border-b border-border pb-4">
              <p className="font-mono text-[11px] text-subtle">
                {d.day}
                {d.gap ? " · GAP" : ""}
                {" · "}
                cores {d.cores.live}/{d.cores.needed}
              </p>
              <p className="mt-1 font-display text-2xl italic">{d.letter.title}</p>
              <p className="mt-1 text-sm text-muted">{d.letter.dek}</p>
              {d.movers[0] ? (
                <p className="mt-2 text-xs text-subtle">
                  Lead mentions: {d.movers[0].name} {d.movers[0].mentions}
                </p>
              ) : null}
              <a href={`/api/day.json?d=${d.day}`} className="mt-2 inline-block text-xs text-accent hover:underline">
                Snapshot
              </a>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-8 text-xs text-subtle">
        <Link to="/week" className="hover:text-fg">
          Letter
        </Link>
        {" · "}
        <Link to="/methods" className="hover:text-fg">
          Methods
        </Link>
      </p>
    </div>
  );
}
