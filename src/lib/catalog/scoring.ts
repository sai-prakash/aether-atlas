import type { TimeWindow } from "./types";

/** Transparent Aether Index — weights are shown in the UI methodology. */
export const WEIGHTS = {
  catalog: 0.42,
  mentions: 0.33,
  social: 0.15,
  recency: 0.1,
} as const;

export function mentionScore(mentions24h: number, mentions7d: number): number {
  const daily = Math.log1p(mentions24h) * 18;
  const weekly = Math.log1p(mentions7d) * 8;
  return Math.min(100, daily + weekly);
}

export function socialScore(githubStars: number, hfDownloads: number): number {
  const stars = Math.log1p(githubStars) * 4.2;
  const hf = Math.log1p(hfDownloads) * 2.4;
  return Math.min(100, stars + hf);
}

export function recencyScore(lastSeen: Date | string | null, now = Date.now()): number {
  if (!lastSeen) return 12;
  const t = typeof lastSeen === "string" ? new Date(lastSeen).getTime() : lastSeen.getTime();
  if (Number.isNaN(t)) return 12;
  const hours = (now - t) / 3_600_000;
  if (hours < 6) return 100;
  if (hours < 24) return 78;
  if (hours < 72) return 52;
  if (hours < 168) return 30;
  return 12;
}

export function aetherIndex(input: {
  catalogWeight: number;
  mentions24h: number;
  mentions7d: number;
  githubStars: number;
  hfDownloads: number;
  lastSeen: Date | string | null;
}): number {
  const m = mentionScore(input.mentions24h, input.mentions7d);
  const s = socialScore(input.githubStars, input.hfDownloads);
  const r = recencyScore(input.lastSeen);
  const raw =
    WEIGHTS.catalog * input.catalogWeight +
    WEIGHTS.mentions * m +
    WEIGHTS.social * s +
    WEIGHTS.recency * r;
  return Math.round(raw * 10) / 10;
}

export function windowHours(window: TimeWindow): number {
  if (window === "24h") return 24;
  if (window === "7d") return 24 * 7;
  return 24 * 30;
}

export function hashTrend(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return ((h % 21) - 10) / 40;
}
