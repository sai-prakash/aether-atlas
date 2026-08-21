import { createFileRoute } from "@tanstack/react-router";
import { getSignals } from "@/lib/server/queries";
import { SOURCE_LABEL } from "@/lib/catalog/types";
import { SignalList } from "@/components/aether/signals";
import { LiveActions } from "@/components/aether/live-actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SOURCES = ["", "hn", "arxiv", "hf", "github", "reddit", "rss"];

export const Route = createFileRoute("/signals")({
  validateSearch: (s: Record<string, unknown>): { source?: string; q?: string } => {
    const out: { source?: string; q?: string } = {};
    if (typeof s.source === "string" && s.source) out.source = s.source;
    if (typeof s.q === "string" && s.q) out.q = s.q;
    return out;
  },
  loaderDeps: ({ search }) => ({ source: search.source ?? "", q: search.q ?? "" }),
  loader: ({ deps }) => getSignals({ data: deps }),
  component: SignalsPage,
});

function SignalsPage() {
  const items = Route.useLoaderData();
  const search = Route.useSearch();
  const nav = Route.useNavigate();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Signals</p>
          <h1 className="mt-2 font-display text-4xl italic">The firehose.</h1>
          <p className="mt-2 text-sm text-muted">
            Hacker News, arXiv, Hugging Face, GitHub, Reddit, and lab RSS — ingested on the daily pulse,
            never invented.
          </p>
        </div>
        <LiveActions />
      </header>
      <Input
        className="mb-4"
        defaultValue={search.q ?? ""}
        placeholder="Filter titles"
        onChange={(e) => nav({ search: { ...search, q: e.target.value } })}
      />
      <div className="mb-5 flex flex-wrap gap-1.5">
        {SOURCES.map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => nav({ search: { ...search, source: s } })}
            className={cn(
              "min-h-8 rounded-full px-3 text-xs font-medium shadow-[var(--shadow-border)]",
              (search.source ?? "") === s ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
            )}
          >
            {s ? SOURCE_LABEL[s] : "All"}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-surface px-4 shadow-[var(--shadow-border)]">
        <SignalList signals={items} />
      </div>
    </div>
  );
}
