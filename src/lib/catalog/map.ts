import type { Entity, EntitySpec, EntityStatus, Insight, Kind, License, Signal } from "./types";

export type EntityRow = {
  id: string;
  kind: string;
  name: string;
  tagline: string;
  description: string;
  license: string;
  vendor: string;
  website: string;
  github: string;
  paper_url: string;
  categories: string;
  techniques: string;
  features: string;
  pricing: string;
  catalog_weight: number | string;
  aliases: string;
  score: number | string;
  momentum: number | string;
  mentions_24h: number | string;
  mentions_7d: number | string;
  github_stars: number | string;
  hf_downloads: number | string;
  last_seen: string | null;
  status?: string;
  verified_at?: string | null;
  spec?: string;
};

function num(v: number | string | null | undefined): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Neon/pg may hand back Date; the desk always wants ISO/text. */
export function asIso(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? "" : v.toISOString();
  if (typeof v === "string") return v;
  return String(v);
}

export function asIsoOrNull(v: unknown): string | null {
  if (v == null || v === "") return null;
  const s = asIso(v);
  return s || null;
}

function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function parseSpec(raw: string | null | undefined): EntitySpec {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as EntitySpec;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function mapEntity(
  row: EntityRow,
  rank = 0,
  prevRank: number | null = null,
  spark: number[] = [],
  kindRank = 0,
): Entity {
  const status: EntityStatus =
    row.status === "deprecated" || row.status === "historic" ? row.status : "active";
  return {
    id: row.id,
    kind: row.kind as Kind,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    license: row.license as License,
    vendor: row.vendor,
    website: row.website,
    github: row.github ?? "",
    paperUrl: row.paper_url ?? "",
    categories: parseList(row.categories),
    techniques: parseList(row.techniques),
    features: parseList(row.features),
    pricing: row.pricing,
    catalogWeight: num(row.catalog_weight),
    aliases: parseList(row.aliases),
    score: num(row.catalog_weight),
    momentum: num(row.mentions_24h),
    mentions24h: num(row.mentions_24h),
    mentions7d: num(row.mentions_7d),
    githubStars: num(row.github_stars),
    hfDownloads: num(row.hf_downloads),
    lastSeen: asIsoOrNull(row.last_seen),
    rank,
    prevRank,
    spark,
    status,
    verifiedAt: asIsoOrNull(row.verified_at),
    spec: parseSpec(row.spec),
    kindRank,
  };
}

export type SignalRow = {
  id: number;
  source: string;
  title: string;
  url: string;
  snippet: string;
  entity_id: string;
  score: number | string;
  published_at: string | null;
  ingested_at: string;
};

export function mapSignal(row: SignalRow): Signal {
  return {
    id: num(row.id),
    source: row.source,
    title: row.title,
    url: row.url,
    snippet: row.snippet ?? "",
    entityId: row.entity_id ?? "",
    score: num(row.score),
    publishedAt: asIsoOrNull(row.published_at),
    ingestedAt: asIso(row.ingested_at) || new Date().toISOString(),
  };
}

export type InsightRow = {
  id: number;
  period: string;
  title: string;
  body: string;
  generated_at: string;
};

export function mapInsight(row: InsightRow): Insight {
  return {
    id: num(row.id),
    period: row.period,
    title: row.title,
    body: row.body,
    generatedAt: asIso(row.generated_at),
  };
}
