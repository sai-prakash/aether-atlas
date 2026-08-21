import type { SourceStatus } from "./types";

/** Core firehoses. GitHub and Artificial Analysis are optional and do not count. */
export const CORE_SOURCES = new Set(["hn", "arxiv", "hf", "hf-papers", "reddit", "rss"]);
export const LIVE_NEEDED = 3;

export type IndexHealth = {
  status: "editorial" | "degraded" | "live";
  live: number;
  needed: number;
  cores: number;
};

export function indexHealth(sources: SourceStatus[]): IndexHealth {
  const cores = sources.filter((s) => CORE_SOURCES.has(s.source));
  const live = cores.filter((s) => s.ok && s.count > 0).length;
  if (cores.length === 0) {
    return { status: "editorial", live: 0, needed: LIVE_NEEDED, cores: 0 };
  }
  if (live < LIVE_NEEDED) {
    return { status: "degraded", live, needed: LIVE_NEEDED, cores: cores.length };
  }
  return { status: "live", live, needed: LIVE_NEEDED, cores: cores.length };
}

export function healthCopy(h: IndexHealth): string {
  if (h.status === "editorial") {
    return "No pulse yet. Rank is the editorial map — catalog prior only.";
  }
  if (h.status === "degraded") {
    return `Index degraded: ${h.live} of ${h.needed} core firehoses returned rows. Scores are not shown. The map is the editorial ranking.`;
  }
  return `${h.live} core firehoses live. Heat is mention counts, not a composite index.`;
}
