import { createFileRoute, Link } from "@tanstack/react-router";
import { compareEntities, listEntities } from "@/lib/server/queries";
import type { Entity } from "@/lib/catalog/types";
import { KIND_LABEL, LICENSE_LABEL } from "@/lib/catalog/types";
import { Lettermark } from "@/components/aether/mark";
import { Delta } from "@/components/aether/delta";
import { Spark } from "@/components/aether/spark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): { ids?: string } => ({
    ids: typeof s.ids === "string" && s.ids ? s.ids : undefined,
  }),
  loaderDeps: ({ search }) => ({ ids: search.ids ?? "" }),
  loader: async ({ deps }) => {
    const selected = deps.ids.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
    const [picked, all] = await Promise.all([
      compareEntities({ data: { ids: selected } }),
      listEntities({ data: { sort: "score" } }),
    ]);
    return { picked, all: all.slice(0, 40), selected };
  },
  component: Compare,
});

function Compare() {
  const { picked, all, selected } = Route.useLoaderData();
  const nav = Route.useNavigate();

  function toggle(id: string) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else if (set.size < 3) set.add(id);
    void nav({ search: { ids: [...set].join(",") } });
  }

  const fields: Array<{ label: string; render: (e: Entity) => string }> = [
    { label: "Kind", render: (e) => KIND_LABEL[e.kind] },
    { label: "License", render: (e) => LICENSE_LABEL[e.license] },
    { label: "Vendor", render: (e) => e.vendor || "—" },
    { label: "Index", render: (e) => e.score.toFixed(1) },
    { label: "Rank", render: (e) => String(e.rank) },
    { label: "Pricing", render: (e) => e.pricing || "—" },
    { label: "Mentions 24h", render: (e) => String(e.mentions24h) },
    { label: "Techniques", render: (e) => e.techniques.join(", ") || "—" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Compare</p>
        <h1 className="mt-2 font-display text-4xl italic">Side by side.</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">Pick up to three entities. The table is the product — no marketing copy.</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {all.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => toggle(e.id)}
            className={cn(
              "min-h-8 rounded-full px-3 text-xs font-medium shadow-[var(--shadow-border)]",
              selected.includes(e.id) ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
            )}
          >
            {e.name}
          </button>
        ))}
      </div>

      {picked.length === 0 ? (
        <p className="text-sm text-muted">Select at least one entity to compare.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-surface shadow-[var(--shadow-border)]">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-subtle">Field</th>
                {picked.map((e) => (
                  <th key={e.id} className="px-4 py-3">
                    <Link to="/e/$slug" params={{ slug: e.id }} className="flex items-center gap-2 hover:text-accent">
                      <Lettermark name={e.name} className="size-8" />
                      <span>{e.name}</span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3 text-xs uppercase tracking-wide text-subtle">Spark</td>
                {picked.map((e) => (
                  <td key={e.id} className="px-4 py-3">
                    <Spark values={e.spark} rising={e.momentum >= 0} />
                    <Delta value={e.momentum} />
                  </td>
                ))}
              </tr>
              {fields.map((f) => (
                <tr key={f.label} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-xs uppercase tracking-wide text-subtle">{f.label}</td>
                  {picked.map((e) => (
                    <td key={e.id} className="px-4 py-3 text-muted">
                      {f.render(e)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {picked.length === 1 ? (
        <p className="mt-4 text-xs text-subtle">Add a second entity to make this useful.</p>
      ) : null}

      <div className="mt-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/atlas">Back to atlas</Link>
        </Button>
      </div>
    </div>
  );
}
