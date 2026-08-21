import type { Sql } from "@/lib/db";
import { mapEntity, mapInsight, mapSignal, asIso, asIsoOrNull, type EntityRow, type InsightRow, type SignalRow } from "@/lib/catalog/map";
import type {
  Entity,
  IngestStatus,
  Insight,
  PulsePayload,
  RankMark,
  Signal,
  SnapPoint,
  SourceStatus,
  TimeWindow,
  CitedMark,
} from "@/lib/catalog/types";
import { PULSE } from "./budget";

const DESK_ID = "desk";
const WINDOW_HOURS: Record<TimeWindow, number> = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30 };

const g = globalThis as typeof globalThis & {
  __aetherPulse__?: { at: number; payload: PulsePayload };
};

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isPayload(v: unknown): v is PulsePayload {
  if (!v || typeof v !== "object") return false;
  const p = v as PulsePayload;
  return Array.isArray(p.entities) && Array.isArray(p.signals) && Boolean(p.prev) && Boolean(p.totals);
}

export function invalidatePulseMem(): void {
  g.__aetherPulse__ = undefined;
}

export async function writePulse(sql: Sql, payload: PulsePayload): Promise<void> {
  const raw = JSON.stringify(payload);
  const safe = JSON.parse(raw) as PulsePayload;
  await sql.query(
    `insert into pulse_state (id, payload, built_at) values ($1, $2, $3)
     on conflict (id) do update set payload = excluded.payload, built_at = excluded.built_at`,
    [DESK_ID, raw, safe.builtAt],
  );
  g.__aetherPulse__ = { at: Date.now(), payload: safe };
}

export async function patchPulse(sql: Sql, patch: Partial<PulsePayload>): Promise<PulsePayload> {
  const current = await getPulse(sql);
  const next: PulsePayload = { ...current, ...patch };
  await writePulse(sql, next);
  return next;
}

export async function getPulse(sql: Sql): Promise<PulsePayload> {
  const now = Date.now();
  const mem = g.__aetherPulse__;
  if (mem && now - mem.at < PULSE.memTtlMs) return mem.payload;

  try {
    const rows = await sql<{ payload: string }>`
      select payload from pulse_state where id = ${DESK_ID} limit 1`;
    if (rows[0]) {
      const parsed: unknown = JSON.parse(rows[0].payload);
      if (isPayload(parsed)) {
        g.__aetherPulse__ = { at: now, payload: parsed };
        return parsed;
      }
    }
  } catch {
    // Table missing on a first boot before migrate — fall through and materialize.
  }

  return materializePulse(sql);
}

function ranksAt(byEntity: Record<string, SnapPoint[]>, hoursAgo: number, now: number): Record<string, RankMark> {
  const at = now - hoursAgo * 3_600_000;
  const out: Record<string, RankMark> = {};
  for (const [id, pts] of Object.entries(byEntity)) {
    for (let i = pts.length - 1; i >= 0; i -= 1) {
      const t = new Date(pts[i].at).getTime();
      if (!Number.isNaN(t) && t <= at) {
        out[id] = { rank: pts[i].rank, score: pts[i].score };
        break;
      }
    }
  }
  return out;
}

function aggregates(entities: Entity[]): Pick<PulsePayload, "totals" | "byCategory" | "licenseSplit"> {
  const catMap = new Map<string, { count: number; sum: number }>();
  const licMap = new Map<string, { count: number; sum: number }>();
  let tools = 0;
  let models = 0;
  let papers = 0;
  let techniques = 0;
  for (const e of entities) {
    if (e.kind === "tool") tools += 1;
    else if (e.kind === "model") models += 1;
    else if (e.kind === "paper") papers += 1;
    else if (e.kind === "technique" || e.kind === "workflow" || e.kind === "protocol") techniques += 1;
    for (const c of e.categories) {
      const cur = catMap.get(c) ?? { count: 0, sum: 0 };
      cur.count += 1;
      cur.sum += e.score;
      catMap.set(c, cur);
    }
    const lic = e.license || "mixed";
    const lcur = licMap.get(lic) ?? { count: 0, sum: 0 };
    lcur.count += 1;
    lcur.sum += e.score;
    licMap.set(lic, lcur);
  }
  return {
    totals: {
      entities: entities.length,
      tools,
      models,
      papers,
      techniques,
      signals24h: 0,
      signals7d: 0,
    },
    byCategory: [...catMap.entries()]
      .map(([category, v]) => ({ category, count: v.count, avgScore: v.count ? v.sum / v.count : 0 }))
      .sort((a, b) => b.avgScore - a.avgScore),
    licenseSplit: [...licMap.entries()].map(([license, v]) => ({
      license,
      count: v.count,
      avgScore: v.count ? v.sum / v.count : 0,
    })),
  };
}

async function ingestStatus(sql: Sql): Promise<IngestStatus> {
  const rows = await sql<{
    id: number;
    started_at: string;
    finished_at: string | null;
    status: string;
    sources: string;
    stats: string;
  }>`select id, started_at, finished_at, status, sources, stats from ingest_runs order by id desc limit 1`;
  const r = rows[0];
  if (!r) {
    return { id: null, startedAt: null, finishedAt: null, status: "idle", sources: [], stats: {} };
  }
  const parsedSources = parseJson<SourceStatus[] | Record<string, unknown>>(r.sources, []);
  const parsedStats = parseJson<Record<string, number>>(r.stats, {});
  return {
    id: Number(r.id),
    startedAt: asIsoOrNull(r.started_at),
    finishedAt: asIsoOrNull(r.finished_at),
    status: r.status,
    sources: Array.isArray(parsedSources) ? parsedSources : [],
    stats: parsedStats && typeof parsedStats === "object" && !Array.isArray(parsedStats) ? parsedStats : {},
  };
}

/** Rebuild the single-row desk snapshot from current tables. Called after a pulse, not on page views. */
export async function materializePulse(
  sql: Sql,
  extra?: { citedAa?: Record<string, CitedMark> },
): Promise<PulsePayload> {
  const now = Date.now();
  const since45 = new Date(now - PULSE.snapshotDays * 86_400_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();
  const weekAgo = new Date(now - 7 * 86_400_000).toISOString();

  const [entityRows, signalRows, insightRows, ingest, snapRows, sig24, sig7] = await Promise.all([
    sql<EntityRow>`select * from entities order by score desc`,
    sql<SignalRow>`
      select * from signals
      order by coalesce(published_at, ingested_at) desc
      limit 200`,
    sql<InsightRow>`select * from insights order by generated_at desc limit 1`,
    ingestStatus(sql),
    sql<{ entity_id: string; captured_at: string; score: number; rank: number; mentions: number }>`
      select entity_id, captured_at, score, rank, mentions
      from snapshots
      where captured_at >= ${since45}
      order by captured_at asc`,
    sql<{ n: number }>`select count(*)::int as n from signals where coalesce(published_at, ingested_at) >= ${dayAgo}`,
    sql<{ n: number }>`select count(*)::int as n from signals where coalesce(published_at, ingested_at) >= ${weekAgo}`,
  ]);

  const snapshots: Record<string, SnapPoint[]> = {};
  for (const s of snapRows) {
    const list = snapshots[s.entity_id] ?? [];
    list.push({
      at: asIso(s.captured_at),
      score: Number(s.score),
      rank: Number(s.rank),
      mentions: Number(s.mentions),
    });
    snapshots[s.entity_id] = list;
  }

  const prev24 = ranksAt(snapshots, WINDOW_HOURS["24h"], now);
  const entities: Entity[] = entityRows.map((row, i) => {
    const spark = (snapshots[row.id] ?? []).map((p) => p.score).slice(-14);
    return mapEntity(row, i + 1, prev24[row.id]?.rank ?? null, spark);
  });

  const agg = aggregates(entities);
  agg.totals.signals24h = Number(sig24[0]?.n ?? 0);
  agg.totals.signals7d = Number(sig7[0]?.n ?? 0);

  const prev: PulsePayload["prev"] = {
    "24h": prev24,
    "7d": ranksAt(snapshots, WINDOW_HOURS["7d"], now),
    "30d": ranksAt(snapshots, WINDOW_HOURS["30d"], now),
  };

  const insight: Insight | null = insightRows[0] ? mapInsight(insightRows[0]) : null;
  const signals: Signal[] = signalRows.map(mapSignal);

  const payload: PulsePayload = {
    builtAt: new Date(now).toISOString(),
    ingest,
    totals: agg.totals,
    entities,
    prev,
    signals,
    insight,
    snapshots,
    byCategory: agg.byCategory,
    licenseSplit: agg.licenseSplit,
    citedAa: extra?.citedAa ?? {},
  };

  try {
    await writePulse(sql, payload);
  } catch {
    g.__aetherPulse__ = { at: now, payload };
  }
  return payload;
}

