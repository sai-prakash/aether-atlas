import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDrift } from "@/lib/server/queries";
import type { TimeWindow } from "@/lib/catalog/types";
import { WindowToggle } from "@/components/aether/window-toggle";
import { windowLabel, atStamp } from "@/lib/utils";
import { KIND_LABEL } from "@/lib/catalog/types";

const PALETTE = [
  "var(--color-accent)",
  "var(--color-muted)",
  "var(--color-rise)",
  "var(--color-fg)",
  "var(--color-fall)",
  "var(--color-subtle)",
  "var(--color-accent)",
  "var(--color-muted)",
];

export const Route = createFileRoute("/drift")({
  validateSearch: (s: Record<string, unknown>): { window?: TimeWindow } => {
    if (s.window === "24h" || s.window === "30d" || s.window === "7d") return { window: s.window };
    return {};
  },
  loaderDeps: ({ search }) => ({ window: search.window ?? "7d" }),
  loader: ({ deps }) => getDrift({ data: { window: deps.window } }),
  component: Drift,
});

function Drift() {
  const data = Route.useLoaderData();
  const { window: windowRaw } = Route.useSearch();
  const window = windowRaw ?? "7d";

  const times = new Set<string>();
  for (const s of data.series) for (const p of s.points) times.add(atStamp(p.at, 16));
  const ticks = [...times].sort();
  const chart = ticks.map((t) => {
    const row: Record<string, string | number> = { t };
    for (const s of data.series) {
      const pt =
        s.points.find((p) => atStamp(p.at, 16) === t) ??
        s.points.find((p) => atStamp(p.at, 10) === t.slice(0, 10));
      if (pt) row[s.name] = pt.score;
    }
    return row;
  });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Drift</p>
          <h1 className="mt-2 font-display text-4xl italic">How the map is shifting.</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Mention counts for current leaders over {windowLabel(window)}. Rank does not move with the
            firehose.
          </p>
        </div>
        <WindowToggle value={window} />
      </header>

      <section className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="t" hide />
              <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
              <RTooltip
                contentStyle={{
                  background: "#18181c",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelFormatter={(v) => String(v).slice(0, 16).replace("T", " ")}
              />
              {data.series.map((s, i) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.name}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          {data.series.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
              {s.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl italic">Most mentioned</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.movers.map((m) => (
            <Link
              key={m.entity.id}
              to="/e/$slug"
              params={{ slug: m.entity.id }}
              className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]"
            >
              <div>
                <p className="text-sm font-medium">{m.entity.name}</p>
                <p className="text-xs text-subtle">{KIND_LABEL[m.entity.kind]} · prior {m.entity.catalogWeight}</p>
              </div>
              <span className="tabular text-sm text-muted">{m.delta} / 24h</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
