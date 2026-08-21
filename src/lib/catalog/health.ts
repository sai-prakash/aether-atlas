import type { SourceStatus } from "./types";

/**
 * Core = firehoses that actually answer from a Vercel datacenter.
 * Reddit, GitHub, and Artificial Analysis are optional and never degrade the desk.
 */
export const CORE_SOURCES = new Set(["hn", "arxiv", "hf-papers", "rss"]);
export const OPTIONAL_SOURCES = new Set(["hf", "github", "reddit", "aa", "lobsters"]);
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
    return "No pulse yet. Rank is the editorial map — catalog prior only. Heat is a mention count, not rank.";
  }
  if (h.status === "degraded") {
    return `Firehoses thin: ${h.live} of ${h.needed} core sources (HN, arXiv, HF Daily Papers, lab RSS) returned rows. Rank is still catalog prior. Mentions are shown as weather, not rank.`;
  }
  return `${h.live} core firehoses live. Rank is catalog prior. Heat is mention counts. GitHub trending, Reddit Atom, Lobsters, and Artificial Analysis are cited or optional — never blended into rank.`;
}

export function sourceBadge(st: SourceStatus | undefined): "ok" | "fail" | "skip" | "idle" {
  if (!st) return "idle";
  if (st.ok && st.count > 0) return "ok";
  if (st.optional || (st.error && st.error.startsWith("skipped"))) return "skip";
  if (st.ok && st.count === 0) return "skip";
  return "fail";
}
