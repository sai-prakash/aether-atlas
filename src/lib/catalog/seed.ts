import type { Sql } from "@/lib/db";
import { SEED } from "./seed-data";
import { CHANGELOG_SEED } from "./changelog-seed";
import { DROPS } from "./ira";
import { invalidatePulseMem, materializePulse } from "@/lib/ingest/pulse";
import { refreshIngestIfNeeded } from "@/lib/ingest/run";

const g = globalThis as typeof globalThis & { __aetherCatalogReady__?: boolean };

function json(v: unknown): string {
  return JSON.stringify(v);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Always upsert the editorial map so taglines, aliases, and receipts stay current. */
export async function ensureCatalog(sql: Sql): Promise<void> {
  if (g.__aetherCatalogReady__) return;

  for (const slice of chunk(SEED, 10)) {
    const values: unknown[] = [];
    const placeholders = slice.map((e, i) => {
      const o = i * 20;
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
        e.catalog_weight,
        e.status ?? "active",
        e.verified ?? "2026-08-21",
        json(e.spec ?? {}),
      );
      return `($${o + 1},$${o + 2},$${o + 3},$${o + 4},$${o + 5},$${o + 6},$${o + 7},$${o + 8},$${o + 9},$${o + 10},$${o + 11},$${o + 12},$${o + 13},$${o + 14},$${o + 15},$${o + 16},$${o + 17},$${o + 18},$${o + 19}::date,$${o + 20})`;
    });
    await sql.query(
      `insert into entities (
        id, kind, name, tagline, description, license, vendor, website, github, paper_url,
        categories, techniques, features, pricing, catalog_weight, aliases, score,
        status, verified_at, spec
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
        aliases = excluded.aliases,
        score = excluded.catalog_weight,
        status = excluded.status,
        verified_at = excluded.verified_at,
        spec = excluded.spec`,
      values,
    );
  }

  for (const slice of chunk(CHANGELOG_SEED, 8)) {
    const values: unknown[] = [];
    const placeholders = slice.map((c, i) => {
      const o = i * 5;
      values.push(c.entityId, c.at, c.title, c.body, c.sourceUrl);
      return `($${o + 1},$${o + 2}::date,$${o + 3},$${o + 4},$${o + 5})`;
    });
    await sql.query(
      `insert into changelog (entity_id, at, title, body, source_url)
       values ${placeholders.join(",")}
       on conflict (entity_id, at, title) do update set
         body = excluded.body,
         source_url = excluded.source_url`,
      values,
    );
  }

  const dropIds = DROPS.map((d) => d.id);
  if (dropIds.length) {
    await sql.query(`delete from changelog where entity_id = any($1::text[])`, [dropIds]);
    await sql.query(`delete from entities where id = any($1::text[])`, [dropIds]);
  }

  g.__aetherCatalogReady__ = true;
  invalidatePulseMem();
  const ingested = await refreshIngestIfNeeded(sql);
  if (!ingested) await materializePulse(sql);
}
