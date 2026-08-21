import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { ensureCatalog } from "@/lib/catalog/seed";
import type { Dashboard, Entity, Mover, PulsePayload, TimeWindow, Kind } from "@/lib/catalog/types";
import { windowHours } from "@/lib/catalog/scoring";
import { buildLens, lineageFor } from "@/lib/catalog/lens";
import { indexHealth } from "@/lib/catalog/health";
import { KINDS } from "@/lib/catalog/types";
import { PULSE } from "@/lib/ingest/budget";
import { getPulse, patchPulse } from "@/lib/ingest/pulse";
import { claimPulse, runIngest } from "@/lib/ingest/run";

async function desk(): Promise<PulsePayload> {
  const sql = await getSql();
  await ensureCatalog(sql);
  return getPulse(sql);
}

function withPrev(entities: Entity[], prev: Record<string, { rank: number; score: number }>): Entity[] {
  return entities.map((e, i) => ({
    ...e,
    rank: i + 1,
    prevRank: prev[e.id]?.rank ?? null,
  }));
}

function moversOf(entities: Entity[]): Mover[] {
  return entities
    .map((entity) => ({
      entity,
      delta: entity.mentions24h,
      rankDelta: 0,
    }))
    .sort((a, b) => b.delta - a.delta);
}

function dashboardFrom(pulse: PulsePayload, window: TimeWindow): Dashboard {
  const hours = windowHours(window);
  const since = Date.now() - hours * 3_600_000;
  const prev = pulse.prev[window] ?? {};
  const ranked = withPrev(pulse.entities, prev);
  const movers = moversOf(ranked);
  const signals = pulse.signals.filter((s) => {
    const t = new Date(s.publishedAt ?? s.ingestedAt).getTime();
    return !Number.isNaN(t) && t >= since;
  });
  const health = indexHealth(pulse.ingest.sources ?? []);
  const kinds: Kind[] = ["model", "tool", "technique", "workflow", "lab", "paper", "protocol"];
  const byKind = kinds
    .map((kind) => ({
      kind,
      leaders: ranked.filter((e) => e.kind === kind && e.status !== "deprecated").slice(0, 6),
    }))
    .filter((row) => row.leaders.length);
  return {
    generatedAt: pulse.builtAt,
    window,
    totals: pulse.totals,
    ingest: pulse.ingest,
    leaders: ranked.filter((e) => e.status !== "deprecated").slice(0, 24),
    movers: health.status === "live" ? movers.filter((m) => m.delta > 0).slice(0, 8) : [],
    losers: health.status === "live" ? movers.filter((m) => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 6) : [],
    byCategory: pulse.byCategory,
    licenseSplit: pulse.licenseSplit,
    signals: signals.slice(0, 24),
    insight: pulse.insight,
    lens: buildLens(ranked, pulse.signals, pulse.citedAa),
    health,
    changelog: pulse.changelog ?? [],
    byKind,
  };
}

export const getDashboard = createServerFn({ method: "GET" })
  .validator((input: { window?: TimeWindow } | undefined) => ({
    window: (input?.window ?? "24h") as TimeWindow,
  }))
  .handler(async ({ data }): Promise<Dashboard> => {
    const pulse = await desk();
    return dashboardFrom(pulse, data.window);
  });

export const listEntities = createServerFn({ method: "GET" })
  .validator((input: { q?: string; kind?: string; license?: string; category?: string; sort?: string } | undefined) => ({
    q: input?.q ?? "",
    kind: input?.kind ?? "",
    license: input?.license ?? "",
    category: input?.category ?? "",
    sort: input?.sort === "momentum" || input?.sort === "mentions" || input?.sort === "score" || input?.sort === "map" ? input.sort : "map",
  }))
  .handler(async ({ data }) => {
    const pulse = await desk();
    const q = data.q.trim().toLowerCase();
    const filtered = pulse.entities.filter((e) => {
      if (data.kind && e.kind !== data.kind) return false;
      if (data.license && e.license !== data.license) return false;
      if (data.category && !e.categories.some((c) => c.toLowerCase() === data.category.toLowerCase())) return false;
      if (q) {
        const blob = `${e.name} ${e.tagline} ${e.vendor} ${e.aliases.join(" ")} ${e.techniques.join(" ")}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
    filtered.sort((a, b) => {
      if (data.sort === "momentum") return b.mentions24h - a.mentions24h;
      if (data.sort === "mentions") return b.mentions7d - a.mentions7d;
      if (data.sort === "score") return b.score - a.score;
      return b.catalogWeight - a.catalogWeight;
    });
    return withPrev(filtered, pulse.prev["24h"] ?? {});
  });

export const getEntity = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const pulse = await desk();
    const entity = pulse.entities.find((e) => e.id === data.id);
    if (!entity) return null;
    const relatedIds = new Set(entity.techniques);
    const byTech = pulse.entities.filter((e) => relatedIds.has(e.id) && e.id !== entity.id);
    const sameKind = pulse.entities.filter((e) => e.kind === entity.kind && e.id !== entity.id).slice(0, 6);
    const relatedMap = new Map<string, Entity>();
    for (const r of [...byTech, ...sameKind]) relatedMap.set(r.id, r);
    const graph = lineageFor(entity, pulse.entities);
    return {
      entity,
      signals: pulse.signals.filter((s) => s.entityId === entity.id).slice(0, 20),
      related: [...relatedMap.values()].slice(0, 10),
      snapshots: (pulse.snapshots[entity.id] ?? []).map((p) => ({
        ...p,
        at: typeof p.at === "string" ? p.at : new Date(p.at).toISOString(),
      })),
      uses: graph.uses,
      usedBy: graph.usedBy,
      changelog: (pulse.changelog ?? []).filter((c) => c.entityId === entity.id),
    };
  });

export const getSignals = createServerFn({ method: "GET" })
  .validator((input: { source?: string; q?: string } | undefined) => ({
    source: input?.source ?? "",
    q: input?.q ?? "",
  }))
  .handler(async ({ data }) => {
    const pulse = await desk();
    const q = data.q.trim().toLowerCase();
    return pulse.signals
      .filter((s) => {
        if (data.source && s.source !== data.source) return false;
        if (q && !`${s.title} ${s.snippet}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .slice(0, 80);
  });

export const getRankings = createServerFn({ method: "GET" })
  .validator((input: { kind?: string; license?: string; window?: TimeWindow } | undefined) => {
    const kind =
      typeof input?.kind === "string" && (KINDS as readonly string[]).includes(input.kind)
        ? input.kind
        : "model";
    return {
      kind,
      license: input?.license ?? "",
      window: (input?.window ?? "24h") as TimeWindow,
    };
  })
  .handler(async ({ data }) => {
    const pulse = await desk();
    const filtered = pulse.entities.filter((e) => {
      if (e.kind !== data.kind) return false;
      if (data.license && e.license !== data.license) return false;
      return e.status !== "deprecated";
    });
    const sorted = [...filtered].sort((a, b) => b.catalogWeight - a.catalogWeight);
    return withPrev(sorted, pulse.prev[data.window] ?? {});
  });

export const searchAll = createServerFn({ method: "GET" })
  .validator((input: { q: string }) => input)
  .handler(async ({ data }) => {
    const q = data.q.trim().toLowerCase();
    if (q.length < 1) return [] as Entity[];
    const pulse = await desk();
    return pulse.entities
      .filter((e) => `${e.name} ${e.tagline} ${e.kind} ${e.vendor} ${e.aliases.join(" ")}`.toLowerCase().includes(q))
      .slice(0, 12);
  });

export const compareEntities = createServerFn({ method: "GET" })
  .validator((input: { ids: string[] }) => ({ ids: input.ids.slice(0, 3) }))
  .handler(async ({ data }) => {
    const pulse = await desk();
    const prev = pulse.prev["24h"] ?? {};
    const mapped = withPrev(
      data.ids.map((id) => pulse.entities.find((e) => e.id === id)).filter((e): e is Entity => Boolean(e)),
      prev,
    );
    return data.ids.map((id) => mapped.find((e) => e.id === id)).filter((e): e is Entity => Boolean(e));
  });

export const getDrift = createServerFn({ method: "GET" })
  .validator((input: { window?: TimeWindow } | undefined) => ({
    window: (input?.window ?? "7d") as TimeWindow,
  }))
  .handler(async ({ data }) => {
    const pulse = await desk();
    const hours = windowHours(data.window);
    const since = Date.now() - hours * 3_600_000;
    const top = pulse.entities.slice(0, 8);
    const series = top.map((t) => ({
      id: t.id,
      name: t.name,
      points: (pulse.snapshots[t.id] ?? [])
        .filter((p) => {
          const ts = new Date(p.at).getTime();
          return !Number.isNaN(ts) && ts >= since;
        })
        .map((p) => ({
          at: typeof p.at === "string" ? p.at : new Date(p.at).toISOString(),
          score: p.mentions,
          rank: p.rank,
        })),
    }));
    const prev = pulse.prev[data.window] ?? {};
    const now = withPrev(pulse.entities, prev);
    const movers = moversOf(now)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 16);
    return { window: data.window, series, movers };
  });

export const refreshLive = createServerFn({ method: "POST" }).handler(async () => {
  const editor = process.env.EDITOR_TOKEN?.trim();
  if (!editor) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: "cron-only" as const,
      last: null as string | null,
      sources: [] as PulsePayload["ingest"]["sources"],
      inserted: 0,
      updated: 0,
    };
  }
  const sql = await getSql();
  await ensureCatalog(sql);
  const claimed = await claimPulse(sql, PULSE.minManualMs);
  if (!claimed.ok) {
    return {
      ok: true as const,
      skipped: true as const,
      reason: claimed.reason,
      last: claimed.last,
      sources: [] as PulsePayload["ingest"]["sources"],
      inserted: 0,
      updated: 0,
    };
  }
  const result = await runIngest(sql, { runId: claimed.runId });
  return { ok: true as const, skipped: false as const, last: new Date().toISOString(), ...result };
});

export const generateBrief = createServerFn({ method: "POST" }).handler(async () => {
  const sql = await getSql();
  await ensureCatalog(sql);
  const pulse = await getPulse(sql);
  if (pulse.insight) {
    const t = new Date(pulse.insight.generatedAt).getTime();
    if (!Number.isNaN(t) && Date.now() - t < PULSE.insightHours * 3_600_000) {
      return { ok: true as const, cached: true as const, insight: pulse.insight };
    }
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return { ok: false as const, error: "AI briefing is unavailable in this environment." };
  }

  const leaders = pulse.entities.slice(0, 12).map((e) => ({
    name: e.name,
    kind: e.kind,
    prior: e.catalogWeight,
    mentions24h: e.mentions24h,
  }));
  const movers = [...pulse.entities]
    .sort((a, b) => b.mentions24h - a.mentions24h)
    .slice(0, 8)
    .map((e) => ({ name: e.name, mentions24h: e.mentions24h }));
  const signals = pulse.signals.slice(0, 18).map((s) => ({ source: s.source, title: s.title }));

  const prompt = `You are Hundred, a precise editorial desk for the AI ecosystem.
Write a daily brief (title + 3 short sections: Mention weather, Why it matters, Watch next).
Rules: catalog prior is editorial and does not move with mentions. Do not describe prior as a live index. Only use the supplied evidence. Do not invent papers, numbers, or launches. If evidence is thin, say so. Neutral, editorial tone. No hype, no emojis.
Return JSON: {"title": string, "body": string} where body is markdown with ### headings.

Editorial leaders (prior, not a live rank): ${JSON.stringify(leaders)}
Most mentioned 24h: ${JSON.stringify(movers)}
Live signals: ${JSON.stringify(signals)}`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 700,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    return { ok: false as const, error: `Brief failed (${res.status}). Try again later.` };
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = body.choices?.[0]?.message?.content ?? "";
  let title = "Daily brief";
  let markdown = text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { title?: string; body?: string };
      if (parsed.title) title = parsed.title;
      if (parsed.body) markdown = parsed.body;
    } catch {
      // keep raw
    }
  }
  const inserted = await sql<{
    id: number;
    period: string;
    title: string;
    body: string;
    generated_at: string;
  }>`
    insert into insights (period, title, body) values ('day', ${title}, ${markdown})
    returning id, period, title, body, generated_at`;
  const row = inserted[0];
  const insight = {
    id: Number(row.id),
    period: row.period,
    title: row.title,
    body: row.body,
    generatedAt: row.generated_at,
  };
  await patchPulse(sql, { insight });
  return { ok: true as const, cached: false as const, insight };
});

export const getLens = createServerFn({ method: "GET" }).handler(async () => {
  const pulse = await desk();
  return {
    builtAt: pulse.builtAt,
    ingest: pulse.ingest,
    ...buildLens(pulse.entities, pulse.signals, pulse.citedAa),
  };
});

export const getAtlasExport = createServerFn({ method: "GET" }).handler(async () => {
  const pulse = await desk();
  return {
    generatedAt: pulse.builtAt,
    health: indexHealth(pulse.ingest.sources ?? []),
    entities: pulse.entities.map((e) => ({
      id: e.id,
      kind: e.kind,
      name: e.name,
      tagline: e.tagline,
      license: e.license,
      vendor: e.vendor,
      website: e.website,
      github: e.github,
      paperUrl: e.paperUrl,
      categories: e.categories,
      techniques: e.techniques,
      pricing: e.pricing,
      catalogWeight: e.catalogWeight,
      aliases: e.aliases,
      status: e.status,
      verifiedAt: e.verifiedAt,
      spec: e.spec,
      mentions7d: e.mentions7d,
    })),
    changelog: pulse.changelog ?? [],
  };
});
