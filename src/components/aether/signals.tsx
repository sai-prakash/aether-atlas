import type { Signal } from "@/lib/catalog/types";
import { SOURCE_LABEL } from "@/lib/catalog/types";
import { formatRelative } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export function SignalList({ signals, compact = false }: { signals: Signal[]; compact?: boolean }) {
  if (signals.length === 0) {
    return (
      <p className="px-1 py-8 text-sm text-muted">
        No live signals yet. Pull live sources to ingest Hacker News, arXiv, Hugging Face, GitHub, Reddit, and lab RSS.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {signals.map((s) => (
        <li key={s.id} className="py-3">
          <a href={s.url} target="_blank" rel="noreferrer" className="group block">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[11px] uppercase tracking-wide text-subtle">
                {SOURCE_LABEL[s.source] ?? s.source}
                <span className="mx-1.5 text-border-strong">·</span>
                {formatRelative(s.publishedAt ?? s.ingestedAt)}
              </p>
              {s.score > 1 ? <span className="tabular text-[11px] text-muted">{s.score}</span> : null}
            </div>
            <p className="mt-1 text-sm leading-snug text-fg group-hover:text-accent">{s.title}</p>
            {!compact && s.snippet ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{s.snippet}</p>
            ) : null}
          </a>
          {s.entityId ? (
            <Link
              to="/e/$slug"
              params={{ slug: s.entityId }}
              className="mt-1 inline-block text-[11px] uppercase tracking-wide text-subtle hover:text-fg"
            >
              Linked · {s.entityId}
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
