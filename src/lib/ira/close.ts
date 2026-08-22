import type { Sql } from "@/lib/db";
import type { PulsePayload } from "@/lib/catalog/types";
import { patchPulse } from "@/lib/ingest/pulse";
import { buildDay, DAY_SCHEMA, type DayRecord } from "./day";

function previousUtcDate(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

/** Rewrite only: false quiet, or today's row still on the rolling-24h schema. */
export function needsRepair(existing: DayRecord, next: DayRecord): boolean {
  if ((existing.schema ?? 1) < DAY_SCHEMA && existing.day === next.day) return true;
  if (existing.gap || next.gap) return false;
  return existing.movers.length === 0 && next.movers.length > 0;
}

export async function closeIraDay(sql: Sql, pulse: PulsePayload): Promise<DayRecord> {
  const today = pulse.builtAt.slice(0, 10);
  const end = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000).toISOString();
  const start = `${today}T00:00:00.000Z`;
  const unresolvedRows = await sql<{ n: number }>`
    select count(*)::int as n from signals
    where entity_id = ''
      and coalesce(published_at, ingested_at) >= ${start}::timestamptz
      and coalesce(published_at, ingested_at) < ${end}::timestamptz`;
  const mentionRows = await sql<{ entity_id: string; n: number }>`
    select entity_id, count(*)::int as n from signals
    where entity_id <> ''
      and coalesce(published_at, ingested_at) >= ${start}::timestamptz
      and coalesce(published_at, ingested_at) < ${end}::timestamptz
    group by entity_id`;
  const dayCounts = Object.fromEntries(mentionRows.map((r) => [r.entity_id, r.n]));
  const existing = await getIraDay(sql, today);
  const yesterday = await getIraDay(sql, previousUtcDate(today));
  const prevById = Object.fromEntries((yesterday?.attention ?? []).map((a) => [a.id, a.mentions]));
  const day = buildDay(pulse, Number(unresolvedRows[0]?.n ?? 0), prevById, dayCounts);

  if (existing && !needsRepair(existing, day)) {
    try {
      await patchPulse(sql, { iraDay: existing });
    } catch {
      /* extra is optional */
    }
    return existing;
  }

  await sql.query(
    `insert into ira_days (day, payload, cores, gap, letter, built_at)
     values ($1::date, $2, $3, $4, $5, $6)
     on conflict (day) do update set
       payload = excluded.payload,
       cores = excluded.cores,
       gap = excluded.gap,
       letter = excluded.letter,
       built_at = excluded.built_at`,
    [day.day, JSON.stringify(day), day.cores.live, day.gap, day.letter.body, day.builtAt],
  );

  try {
    await patchPulse(sql, { iraDay: day });
  } catch {
    // Pulse extra is optional.
  }

  await pushArchive(day).catch(() => undefined);
  return day;
}

export async function getIraDay(sql: Sql, day: string): Promise<DayRecord | null> {
  const rows = await sql<{ payload: unknown }>`
    select payload from ira_days where day = ${day}::date limit 1`;
  if (!rows[0]) return null;
  return rows[0].payload as DayRecord;
}

export async function listIraDays(sql: Sql, limit = 90): Promise<DayRecord[]> {
  const rows = await sql<{ payload: unknown }>`
    select payload from ira_days order by day desc limit ${limit}`;
  return rows.map((r) => r.payload as DayRecord);
}

/** Optional public dataset commit. Never fail the pulse if GitHub is dark. */
async function pushArchive(day: DayRecord): Promise<void> {
  const token = process.env.ARCHIVE_GITHUB_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
  const repo = process.env.ARCHIVE_REPO?.trim() || "sai-prakash/aether-atlas";
  if (!token) return;
  const [owner, name] = repo.split("/");
  if (!owner || !name) return;
  const path = `data/days/${day.day}.json`;
  const content = Buffer.from(`${JSON.stringify(day, null, 2)}\n`, "utf8").toString("base64");
  let sha: string | undefined;
  const get = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
  });
  if (get.ok) {
    const body = (await get.json()) as { sha?: string };
    sha = body.sha;
  }
  await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      message: `data: ${day.day}${day.gap ? " GAP" : ""}`,
      content,
      sha,
      branch: process.env.ARCHIVE_BRANCH?.trim() || "main",
    }),
  });
}
