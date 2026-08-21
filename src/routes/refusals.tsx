import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/lib/site";
import { REFUSALS } from "@/lib/catalog/ira";

export const Route = createFileRoute("/refusals")({
  head: () => ({
    meta: [
      { title: `Kill-list · ${SITE.name}` },
      { name: "description", content: "What Ira Prior refuses to put on the map." },
    ],
  }),
  component: Refusals,
});

function Refusals() {
  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 border-b border-border pb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Kill-list</p>
        <h1 className="mt-2 font-display text-4xl italic">What is not on the map.</h1>
        <p className="mt-3 text-sm text-muted">
          Signed by {SITE.editor}. A canon that never drops is a directory. These refusals are as
          much the product as the hundred that remain.
        </p>
      </header>
      <ol className="space-y-5">
        {REFUSALS.map((r, i) => (
          <li key={r.name}>
            <p className="font-mono text-[11px] text-subtle">{String(i + 1).padStart(2, "0")}</p>
            <h2 className="mt-1 font-display text-2xl italic">{r.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{r.why}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
