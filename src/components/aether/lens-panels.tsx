import { Link } from "@tanstack/react-router";
import type { Displacement, Disagreement, Lineage } from "@/lib/catalog/types";
import { BOARD_LABEL } from "@/lib/catalog/lens";
import { CATEGORY_LABEL } from "@/lib/catalog/types";
import { Delta } from "./delta";
import { Lettermark } from "./mark";

export function DisagreementList({
  rows,
  compact,
}: {
  rows: Disagreement[];
  compact?: boolean;
}) {
  if (!rows.length) {
    return (
      <p className="px-1 py-4 text-sm text-muted">
        Not enough overlapping boards yet. Disagreement appears once catalog, firehose, papers, or
        Artificial Analysis rank the same name differently.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {rows.slice(0, compact ? 5 : 12).map((row) => (
        <li key={row.entity.id}>
          <Link
            to="/e/$slug"
            params={{ slug: row.entity.id }}
            className="flex flex-col gap-1.5 px-1 py-3 hover:bg-elevated/40 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Lettermark name={row.entity.name} kind={row.entity.kind} className="size-8 text-[10px]" />
              <span className="min-w-0">
                <span className="block truncate text-sm text-fg">{row.entity.name}</span>
                <span className="block text-[11px] text-subtle">spread {row.spread} ranks</span>
              </span>
            </span>
            <span className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
              {row.boards.map((b) => (
                <span key={b.board}>
                  {BOARD_LABEL[b.board].split(" ")[0]} #{b.rank}
                </span>
              ))}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function LineageList({ rows, compact }: { rows: Lineage[]; compact?: boolean }) {
  if (!rows.length) {
    return <p className="px-1 py-4 text-sm text-muted">No technique lineage in this snapshot.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {rows.slice(0, compact ? 6 : 16).map((row) => (
        <li key={row.technique.id} className="px-1 py-3">
          <Link
            to="/e/$slug"
            params={{ slug: row.technique.id }}
            className="font-display text-lg italic hover:text-accent"
          >
            {row.technique.name}
          </Link>
          <p className="mt-1 text-[11px] text-subtle">
            {row.usedBy.length} models, tools, and labs ship this
          </p>
          <p className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
            {row.usedBy.slice(0, compact ? 5 : 10).map((e) => (
              <Link key={e.id} to="/e/$slug" params={{ slug: e.id }} className="hover:text-fg">
                {e.name}
              </Link>
            ))}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function DisplacementList({
  rows,
  compact,
}: {
  rows: Displacement[];
  compact?: boolean;
}) {
  if (!rows.length) {
    return (
      <p className="px-1 py-4 text-sm text-muted">
        Open displacement needs live mentions on both a commercial and an open-source name in the
        same category.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {rows.slice(0, compact ? 4 : 8).map((row) => (
        <li key={row.category} className="flex flex-col gap-1 px-1 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[11px] uppercase tracking-[0.14em] text-subtle">
            {CATEGORY_LABEL[row.category] ?? row.category}
          </span>
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/e/$slug" params={{ slug: row.open.id }} className="text-fg hover:text-accent">
              {row.open.name}
            </Link>
            <span className="text-subtle">vs</span>
            <Link to="/e/$slug" params={{ slug: row.commercial.id }} className="text-muted hover:text-fg">
              {row.commercial.name}
            </Link>
            <Delta value={row.mentionGap} />
          </span>
        </li>
      ))}
    </ul>
  );
}
