import { createFileRoute } from "@tanstack/react-router";
import { listEntities } from "@/lib/server/queries";
import { CATEGORIES, CATEGORY_LABEL, KINDS, KIND_LABEL, LICENSES, LICENSE_LABEL } from "@/lib/catalog/types";
import { EntityCard } from "@/components/aether/entity-row";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/atlas")({
  validateSearch: (s: Record<string, unknown>): {
    q?: string;
    kind?: string;
    license?: string;
    category?: string;
    sort?: string;
  } => {
    const out: { q?: string; kind?: string; license?: string; category?: string; sort?: string } = {};
    if (typeof s.q === "string" && s.q) out.q = s.q;
    if (typeof s.kind === "string" && s.kind) out.kind = s.kind;
    if (typeof s.license === "string" && s.license) out.license = s.license;
    if (typeof s.category === "string" && s.category) out.category = s.category;
    if (s.sort === "momentum" || s.sort === "mentions" || s.sort === "score") out.sort = s.sort;
    return out;
  },
  loaderDeps: ({ search }) => ({
    q: search.q ?? "",
    kind: search.kind ?? "",
    license: search.license ?? "",
    category: search.category ?? "",
    sort: search.sort ?? "map",
  }),
  loader: ({ deps }) => listEntities({ data: deps }),
  component: Atlas,
});

function Atlas() {
  const items = Route.useLoaderData();
  const search = Route.useSearch();
  const nav = Route.useNavigate();

  function set(patch: Partial<typeof search>) {
    void nav({ search: { ...search, ...patch } });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Atlas</p>
        <h1 className="mt-2 font-display text-4xl italic">Everything we track.</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Filter by kind, license, and field. Commercial and open-source sit on the same board.
        </p>
      </header>

      <div className="mb-4 flex flex-col gap-3">
        <Input
          defaultValue={search.q ?? ""}
          placeholder="Filter by name, vendor, technique"
          onChange={(e) => set({ q: e.target.value })}
        />
        <ChipRow
          value={search.kind ?? ""}
          onChange={(kind) => set({ kind })}
          options={[{ id: "", label: "All kinds" }, ...KINDS.map((k) => ({ id: k, label: KIND_LABEL[k] }))]}
        />
        <ChipRow
          value={search.license ?? ""}
          onChange={(license) => set({ license })}
          options={[{ id: "", label: "Any license" }, ...LICENSES.map((k) => ({ id: k, label: LICENSE_LABEL[k] }))]}
        />
        <ChipRow
          value={search.category ?? ""}
          onChange={(category) => set({ category })}
          options={[{ id: "", label: "All fields" }, ...CATEGORIES.map((k) => ({ id: k, label: CATEGORY_LABEL[k] }))]}
        />
        <ChipRow
          value={search.sort ?? "score"}
          onChange={(sort) => set({ sort })}
          options={[
            { id: "score", label: "Index" },
            { id: "momentum", label: "Momentum" },
            { id: "mentions", label: "Mentions" },
          ]}
        />
      </div>

      <p className="mb-4 text-xs text-subtle">{items.length} entities</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => (
          <EntityCard key={e.id} entity={e} />
        ))}
      </div>
    </div>
  );
}

function ChipRow({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id || "all"}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-8 rounded-full px-3 text-xs font-medium shadow-[var(--shadow-border)]",
            value === o.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
