import { Link } from "@tanstack/react-router";
import type { Entity } from "@/lib/catalog/types";
import { KIND_LABEL, LICENSE_LABEL } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Delta, RankDelta } from "./delta";
import { Lettermark } from "./mark";
import { Spark } from "./spark";

export function EntityRow({
  entity,
  showSpark = true,
}: {
  entity: Entity;
  showSpark?: boolean;
}) {
  return (
    <Link
      to="/e/$slug"
      params={{ slug: entity.id }}
      className={cn(
        "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-2.5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_auto_auto]",
        "transition-colors duration-150 hover:bg-elevated",
      )}
    >
      <span className="tabular w-8 text-right font-mono text-xs text-subtle">{entity.rank}</span>
      <div className="flex min-w-0 items-center gap-3">
        <Lettermark name={entity.name} kind={entity.kind} className="hidden sm:inline-flex" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-fg">{entity.name}</span>
            <Badge variant="outline" className="hidden capitalize sm:inline-flex">
              {KIND_LABEL[entity.kind]}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted">{entity.tagline}</p>
        </div>
      </div>
      {showSpark ? (
        <Spark values={entity.spark} rising={entity.momentum >= 0} className="hidden sm:block" />
      ) : (
        <span />
      )}
      <div className="hidden w-16 flex-col items-end sm:flex">
        <RankDelta from={entity.prevRank} to={entity.rank} />
        <span className="text-[10px] uppercase tracking-wide text-subtle">
          {LICENSE_LABEL[entity.license]}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="tabular text-sm font-medium text-fg">{entity.catalogWeight.toFixed(0)}</span>
        <span className="text-[10px] uppercase tracking-wide text-subtle">
          {entity.mentions7d ? `${entity.mentions7d} 7d` : "map"}
        </span>
      </div>
    </Link>
  );
}

export function EntityCard({ entity }: { entity: Entity }) {
  return (
    <Link
      to="/e/$slug"
      params={{ slug: entity.id }}
      className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] transition-[box-shadow,transform] duration-150 hover:shadow-[var(--shadow-border-hover)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Lettermark name={entity.name} kind={entity.kind} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{entity.name}</p>
            <p className="text-[11px] uppercase tracking-wide text-subtle">{KIND_LABEL[entity.kind]}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="tabular text-sm font-medium">{entity.catalogWeight.toFixed(0)}</p>
          <p className="text-[10px] uppercase tracking-wide text-subtle">
            {entity.status === "historic" ? "historic" : entity.mentions7d ? `${entity.mentions7d} 7d` : "map"}
          </p>
        </div>
      </div>
      <p className="line-clamp-2 text-xs leading-relaxed text-muted">{entity.tagline}</p>
      <div className="mt-auto flex items-center justify-between">
        <Spark values={entity.spark} rising={entity.momentum >= 0} />
        <Badge variant="outline">{LICENSE_LABEL[entity.license]}</Badge>
      </div>
    </Link>
  );
}
