import { createFileRoute, notFound } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { getEntity } from "@/lib/server/queries";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/embed/$slug")({
  loader: async ({ params }) => {
    const data = await getEntity({ data: { id: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  component: Embed,
});

function Embed() {
  const { entity, snapshots } = Route.useLoaderData();
  const chart = snapshots.map((s) => ({ m: s.mentions }));
  return (
    <div className="bg-bg p-3 text-fg">
      <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">Mentions · not quality</p>
      <p className="font-display text-xl italic">{entity.name}</p>
      <div className="mt-2 h-16">
        {chart.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <Line type="monotone" dataKey="m" stroke="currentColor" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted">Not enough days for a spark.</p>
        )}
      </div>
      <a href={`${SITE.url}/e/${entity.id}`} className="mt-2 block text-[10px] text-subtle hover:text-fg" target="_top">
        {SITE.name}
      </a>
    </div>
  );
}
