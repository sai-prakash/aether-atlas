import type { Entity, Insight, Kind, License, Signal } from "./types";

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
};

function num(v: number | string | null | undefined): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
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

export function mapEntity(row: EntityRow, rank = 0, prevRank: number | null = null, spark: number[] = []): Entity {
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
    score: num(row.score),
    momentum: num(row.momentum),
    mentions24h: num(row.mentions_24h),
    mentions7d: num(row.mentions_7d),
    githubStars: num(row.github_stars),
    hfDownloads: num(row.hf_downloads),
    lastSeen: row.last_seen,
    rank,
    prevRank,
    spark,
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
    publishedAt: row.published_at,
    ingestedAt: row.ingested_at,
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
    generatedAt: row.generated_at,
  };
}
