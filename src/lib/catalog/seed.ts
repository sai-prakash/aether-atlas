import type { Sql } from "@/lib/db";
import { SEED } from "./seed-data";
import { aetherIndex, hashTrend } from "./scoring";

const g = globalThis as typeof globalThis & { __aetherCatalogReady__?: boolean };

function json(v: unknown): string {
  return JSON.stringify(v);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function ensureCatalog(sql: Sql): Promise<void> {
  if (g.__aetherCatalogReady__) return;

  const existing = await sql<{ n: number }>`select count(*)::int as n from entities`;
  const count = Number(existing[0]?.n ?? 0);

  if (count < SEED.length) {
    for (const slice of chunk(SEED, 12)) {
      const values: unknown[] = [];
      const placeholders = slice.map((e, i) => {
        const o = i * 17;
        const score = aetherIndex({
          catalogWeight: e.catalog_weight,
          mentions24h: 0,
          mentions7d: 0,
          githubStars: 0,
          hfDownloads: 0,
          lastSeen: null,
        });
        values.push(
          e.id,
          e.kind,
          e.name,
          e.tagline,
          e.description,
          e.license,
          e.vendor,
          e.website,
          e.github ?? "",
          e.paper_url ?? "",
          json(e.categories),
          json(e.techniques),
          json(e.features),
          e.pricing,
          e.catalog_weight,
          json(e.aliases),
          score,
        );
        return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8},$${o + 9},$${o + 10},$${o + 11},$${o + 12},$${o + 13},$${o + 14},$${o + 15},$${o + 16},$${o + 17})`;
      });
      await sql.query(
        `insert into entities (
          id, kind, name, tagline, description, license, vendor, website, github, paper_url,
          categories, techniques, features, pricing, catalog_weight, aliases, score
        ) values ${placeholders.join(",")}
        on conflict (id) do update set
          kind = excluded.kind,
          name = excluded.name,
          tagline = excluded.tagline,
          description = excluded.description,
          license = excluded.license,
          vendor = excluded.vendor,
          website = excluded.website,
          github = excluded.github,
          paper_url = excluded.paper_url,
          categories = excluded.categories,
          techniques = excluded.techniques,
          features = excluded.features,
          pricing = excluded.pricing,
          catalog_weight = excluded.catalog_weight,
          aliases = excluded.aliases`,
        values,
      );
    }
  }

  const snaps = await sql<{ n: number }>`select count(*)::int as n from snapshots`;
  if (Number(snaps[0]?.n ?? 0) === 0) {
    await seedHistory(sql);
  }

  g.__aetherCatalogReady__ = true;
}

async function seedHistory(sql: Sql): Promise<void> {
  const now = Date.now();
  type Snap = { id: string; captured: string; score: number; mentions: number };
  const raw: Snap[] = [];

  for (const e of SEED) {
    const trend = e.trend ?? hashTrend(e.id);
    const base = aetherIndex({
      catalogWeight: e.catalog_weight,
      mentions24h: Math.max(0, 4 + trend * 8),
      mentions7d: Math.max(0, 18 + trend * 20),
      githubStars: 0,
      hfDownloads: 0,
      lastSeen: new Date(now - 3_600_000),
    });
    for (let d = 13; d >= 0; d -= 1) {
      const wobble = Math.sin((d + e.id.length) * 0.7) * 0.9;
      const score = Math.max(8, Math.min(99.5, base - trend * (13 - d) * 0.85 + wobble));
      const progress = (13 - d) / 13;
      const mentions = Math.max(0, Math.round((2 + Math.abs(trend) * 6) * (0.6 + progress)));
      const captured = new Date(now - d * 86_400_000 - 3_600_000).toISOString();
      raw.push({ id: e.id, captured, score: Math.round(score * 10) / 10, mentions });
    }
  }

  const byDay = new Map<string, Snap[]>();
  for (const row of raw) {
    const day = row.captured.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(row);
    byDay.set(day, list);
  }

  const ranked: Array<Snap & { rank: number }> = [];
  for (const list of byDay.values()) {
    list.sort((a, b) => b.score - a.score);
    list.forEach((r, i) => ranked.push({ ...r, rank: i + 1 }));
  }

  for (const slice of chunk(ranked, 80)) {
    const values: unknown[] = [];
    const placeholders = slice.map((r, idx) => {
      const o = idx * 5;
      values.push(r.id, r.captured, r.score, r.mentions, r.rank);
      return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},0)`;
    });
    await sql.query(
      `insert into snapshots (entity_id, captured_at, score, mentions, rank, github_stars) values ${placeholders.join(",")}`,
      values,
    );
  }

  const grouped = new Map<string, Array<Snap & { rank: number }>>();
  for (const row of ranked) {
    const list = grouped.get(row.id) ?? [];
    list.push(row);
    grouped.set(row.id, list);
  }

  const latest: Array<{ id: string; score: number; momentum: number; mentions: number; captured: string }> = [];
  for (const [id, list] of grouped) {
    list.sort((a, b) => a.captured.localeCompare(b.captured));
    const last = list[list.length - 1];
    const prev = list[list.length - 2];
    latest.push({
      id,
      score: last.score,
      momentum: Math.round((last.score - (prev?.score ?? last.score)) * 10) / 10,
      mentions: last.mentions,
      captured: last.captured,
    });
  }

  for (const slice of chunk(latest, 40)) {
    const values: unknown[] = [];
    const placeholders = slice.map((v, i) => {
      const o = i * 5;
      values.push(v.id, v.score, v.momentum, v.mentions, v.captured);
      return `($${o + 1},$${o + 2}::real,$${o + 3}::real,$${o + 4}::int,$${o + 5}::timestamptz)`;
    });
    await sql.query(
      `update entities as e set
         score = v.score,
         momentum = v.momentum,
         mentions_24h = v.mentions,
         last_seen = v.captured
       from (values ${placeholders.join(",")}) as v(id, score, momentum, mentions, captured)
       where e.id = v.id`,
      values,
    );
  }
}
