import { createFileRoute } from "@tanstack/react-router";
import { getRankings } from "@/lib/server/queries";
import { KINDS, KIND_LABEL, LICENSES, LICENSE_LABEL, type TimeWindow } from "@/lib/catalog/types";
import { EntityRow } from "@/components/aether/entity-row";
import { WindowToggle } from "@/components/aether/window-toggle";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rankings")({
  validateSearch: (s: Record<string, unknown>): { kind?: string; license?: string; window?: TimeWindow } => {
    const out: { kind?: string; license?: string; window?: TimeWindow } = {};
    if (typeof s.kind === "string" && s.kind) out.kind = s.kind;
    if (typeof s.license === "string" && s.license) out.license = s.license;
    if (s.window === "7d" || s.window === "30d" || s.window === "24h") out.window = s.window;
    return out;
  },
  loaderDeps: ({ search }) => ({
    kind: search.kind ?? "model",
    license: search.license ?? "",
    window: search.window ?? "7d",
  }),
  loader: ({ deps }) => getRankings({ data: deps }),
  component: Rankings,
});

function Rankings() {
  const rows = Route.useLoaderData();
  const search = Route.useSearch();
  const nav = Route.useNavigate();

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Rankings</p>
          <h1 className="mt-2 font-display text-4xl italic">Per kind.</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Editorial map rank within a kind. Not a cross-kind index — Diffusion is not comparable to
            Cursor. Number is catalog prior (0–100). Heat is 7-day mentions, shown only as a count.
          </p>
        </div>
        <WindowToggle value={search.window ?? "24h"} />
      </header>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ id: "", label: "All" }, ...KINDS.map((k) => ({ id: k, label: KIND_LABEL[k] }))].map((o) => (
          <button
            key={o.id || "all"}
            type="button"
            onClick={() => nav({ search: { ...search, kind: o.id } })}
            className={cn(
              "min-h-8 rounded-full px-3 text-xs font-medium shadow-[var(--shadow-border)]",
              search.kind === o.id || (!search.kind && o.id === "model") ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {[{ id: "", label: "Any license" }, ...LICENSES.map((k) => ({ id: k, label: LICENSE_LABEL[k] }))].map((o) => (
          <button
            key={o.id || "all"}
            type="button"
            onClick={() => nav({ search: { ...search, license: o.id } })}
            className={cn(
              "min-h-8 rounded-full px-3 text-xs font-medium shadow-[var(--shadow-border)]",
              search.license === o.id || (!search.license && o.id === "") ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-surface px-2 py-1 shadow-[var(--shadow-border)]">
        {rows.map((e) => (
          <EntityRow key={e.id} entity={e} />
        ))}
      </div>
    </div>
  );
}
