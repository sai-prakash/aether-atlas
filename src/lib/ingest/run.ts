import type { Sql } from "@/lib/db";
import type { SourceStatus } from "@/lib/catalog/types";
import { PULSE } from "./budget";
import { fetchAllSources, type RawSignal } from "./sources";
import { fetchCitedAa } from "./cited";
import { materializePulse } from "./pulse";
import { closeIraDay } from "@/lib/ira/close";

export async function lastSuccessfulRun(sql: Sql): Promise<string | null> {
  const rows = await sql<{ finished_at: string | null }>`
    select finished_at from ingest_runs
    where status = 'ok'
    order by finished_at desc nulls last
    limit 1`;
  return rows[0]?.finished_at ?? null;
}

export async function ingestRevStale(sql: Sql): Promise<boolean> {
  const rows = await sql<{ stats: string }>`
    select stats from ingest_runs where status = 'ok' order by id desc limit 1`;
  if (!rows[0]) return true;
  try {
    const stats = JSON.parse(rows[0].stats) as { ingestRev?: number };
    return Number(stats.ingestRev) !== PULSE.ingestRev;
  } catch {
    return true;
  }
}

/** One ingest when parsers/sources change. Does not run on every page view. */
export async function refreshIngestIfNeeded(sql: Sql): Promise<boolean> {
  if (!(await ingestRevStale(sql))) return false;
  const claimed = await claimPulse(sql, 0);
  if (!claimed.ok) return false;
  await runIngest(sql, { runId: claimed.runId });
  return true;
}

export type Claim =
  | { ok: true; runId: number }
  | { ok: false; reason: "fresh" | "busy"; last: string | null };

export async function claimPulse(sql: Sql, minIntervalMs: number): Promise<Claim> {
  const running = await sql<{ id: number; started_at: string }>`
    select id, started_at from ingest_runs where status = 'running' order by id desc limit 1`;
  if (running[0]) {
    const t = new Date(running[0].started_at).getTime();
    if (!Number.isNaN(t) && Date.now() - t < PULSE.staleLockMs) {
      return { ok: false, reason: "busy", last: running[0].started_at };
    }
    await sql.query(
      `update ingest_runs set status = 'error', finished_at = now(), stats = $1 where id = $2`,
      [JSON.stringify({ error: "stale lock" }), running[0].id],
    );
  }

  const last = await lastSuccessfulRun(sql);
  if (last) {
    const t = new Date(last).getTime();
    if (!Number.isNaN(t) && Date.now() - t < minIntervalMs) {
      return { ok: false, reason: "fresh", last };
    }
  }

  const started = new Date().toISOString();
  const runRows = await sql<{ id: number }>`
    insert into ingest_runs (started_at, status, sources, stats)
    values (${started}, 'running', '[]', '{}') returning id`;
  const runId = runRows[0]?.id;
  if (!runId) throw new Error("failed to open ingest run");
  return { ok: true, runId };
}

export async function runIngest(
  sql: Sql,
  opts?: { runId?: number },
): Promise<{ sources: SourceStatus[]; inserted: number; updated: number }> {
  let runId = opts?.runId;
  if (runId == null) {
    const started = new Date().toISOString();
    const runRows = await sql<{ id: number }>`
      insert into ingest_runs (started_at, status, sources, stats)
      values (${started}, 'running', '[]', '{}') returning id`;
    runId = runRows[0]?.id;
  }

  try {
    const [{ signals, sources }, cited] = await Promise.all([fetchAllSources(), fetchCitedAa()]);
    const allSources = [...sources, cited.status];
    const inserted = await upsertSignals(sql, signals);
    await recomputeScores(sql);
    await pruneDesk(sql);

    const stats = { inserted, signals: signals.length, sources: allSources.filter((s) => s.ok).length, ingestRev: PULSE.ingestRev };
    if (runId) {
      await sql.query(
        `update ingest_runs set finished_at = now(), status = 'ok', sources = $1, stats = $2 where id = $3`,
        [JSON.stringify(allSources), JSON.stringify(stats), runId],
      );
    }
    const pulse = await materializePulse(sql, { citedAa: cited.ranks });
    try {
      await closeIraDay(sql, pulse);
    } catch {
      // ira_days may not be migrated yet — pulse still stands.
    }
    return { sources: allSources, inserted, updated: 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : "ingest failed";
    if (runId) {
      await sql.query(
        `update ingest_runs set finished_at = now(), status = 'error', stats = $1 where id = $2`,
        [JSON.stringify({ error: message.slice(0, 300) }), runId],
      );
    }
    throw err;
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function upsertSignals(sql: Sql, signals: RawSignal[]): Promise<number> {
  const seen = new Set<string>();
  const rows: RawSignal[] = [];
  for (const s of signals) {
    if (!s.url || !s.title) continue;
    const url = s.url.slice(0, 800);
    if (seen.has(url)) continue;
    seen.add(url);
    rows.push(s);
  }
  let inserted = 0;
  for (const slice of chunk(rows, 40)) {
    const values: unknown[] = [];
    const placeholders = slice.map((s, i) => {
      const o = i * 7;
      values.push(
        s.source,
        s.title.slice(0, 400),
        s.url.slice(0, 800),
        s.snippet.slice(0, 500),
        s.entityId,
        s.score,
        s.publishedAt,
      );
      return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7})`;
    });
    const res = await sql.query<{ id: number }>(
      `insert into signals (source, title, url, snippet, entity_id, score, published_at)
       values ${placeholders.join(",")}
       on conflict (url) do update set
         title = excluded.title,
         snippet = excluded.snippet,
         score = excluded.score,
         entity_id = case when excluded.entity_id <> '' then excluded.entity_id else signals.entity_id end,
         ingested_at = now()
       returning id`,
      values,
    );
    inserted += res.length;
  }
  return inserted;
}

async function recomputeScores(sql: Sql): Promise<void> {
  const entities = await sql<{
    id: string;
    catalog_weight: number | string;
    github_stars: number | string;
    hf_downloads: number | string;
  }>`select id, catalog_weight, github_stars, hf_downloads from entities`;

  const now = Date.now();
  const dayAgo = new Date(now - 86400_000).toISOString();
  const weekAgo = new Date(now - 7 * 86400_000).toISOString();

  const [mentionRows, lastSeenRows, prevRows] = await Promise.all([
    sql<{ entity_id: string; n24: number; n7: number }>`
      select entity_id,
        sum(case when coalesce(published_at, ingested_at) >= ${dayAgo} then 1 else 0 end)::int as n24,
        count(*)::int as n7
      from signals
      where entity_id <> '' and coalesce(published_at, ingested_at) >= ${weekAgo}
      group by entity_id`,
    sql<{ entity_id: string; last: string }>`
      select entity_id, max(coalesce(published_at, ingested_at)) as last
      from signals where entity_id <> '' group by entity_id`,
    sql<{ entity_id: string; score: number }>`
      select distinct on (entity_id) entity_id, score
      from snapshots
      order by entity_id, captured_at desc`,
  ]);

  const mentions = new Map(mentionRows.map((r) => [r.entity_id, { n24: Number(r.n24), n7: Number(r.n7) }]));
  const lastSeen = new Map(lastSeenRows.map((r) => [r.entity_id, r.last]));
  const prevScore = new Map(prevRows.map((r) => [r.entity_id, Number(r.score)]));

  const scored: Array<{
    id: string;
    score: number;
    momentum: number;
    m24: number;
    m7: number;
    last: string | null;
  }> = [];
  for (const e of entities) {
    const m = mentions.get(e.id) ?? { n24: 0, n7: 0 };
    const last = lastSeen.get(e.id) ?? null;
    const score = Number(e.catalog_weight) || 0;
    const prev = prevScore.get(e.id) ?? score;
    scored.push({
      id: e.id,
      score,
      momentum: m.n24,
      m24: m.n24,
      m7: m.n7,
      last,
    });
  }
  scored.sort((a, b) => b.score - a.score);

  for (const slice of chunk(scored, 40)) {
    const values: unknown[] = [];
    const placeholders = slice.map((e, i) => {
      const o = i * 6;
      values.push(e.id, e.score, e.momentum, e.m24, e.m7, e.last);
      return `($${o + 1},$${o + 2}::real,$${o + 3}::real,$${o + 4}::int,$${o + 5}::int,$${o + 6}::timestamptz)`;
    });
    await sql.query(
      `update entities as e set
         score = v.score,
         momentum = v.momentum,
         mentions_24h = v.m24,
         mentions_7d = v.m7,
         last_seen = v.last
       from (values ${placeholders.join(",")}) as v(id, score, momentum, m24, m7, last)
       where e.id = v.id`,
      values,
    );
  }

  const captured = new Date().toISOString();
  for (const slice of chunk(
    scored.map((e, i) => ({ ...e, rank: i + 1 })),
    40,
  )) {
    const values: unknown[] = [];
    const placeholders = slice.map((e, i) => {
      const o = i * 5;
      values.push(e.id, captured, e.score, e.m24, e.rank);
      return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},0)`;
    });
    await sql.query(
      `insert into snapshots (entity_id, captured_at, score, mentions, rank, github_stars)
       values ${placeholders.join(",")}`,
      values,
    );
  }
}

async function pruneDesk(sql: Sql): Promise<void> {
  const snapCut = new Date(Date.now() - PULSE.snapshotDays * 86_400_000).toISOString();
  const sigCut = new Date(Date.now() - PULSE.signalDays * 86_400_000).toISOString();
  const runCut = new Date(Date.now() - PULSE.ingestRunDays * 86_400_000).toISOString();
  const insightCut = new Date(Date.now() - 21 * 86_400_000).toISOString();
  await Promise.all([
    sql.query(`delete from snapshots where captured_at < $1`, [snapCut]),
    sql.query(`delete from signals where coalesce(published_at, ingested_at) < $1`, [sigCut]),
    sql.query(`delete from ingest_runs where started_at < $1 and status <> 'running'`, [runCut]),
    sql.query(`delete from insights where generated_at < $1`, [insightCut]),
  ]);
}
