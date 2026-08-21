/**
 * Hundred is edited by Ira Prior, an AI editor.
 * She signs a catalog prior. She does not vote (TAAFT) and does not Elo (Arena).
 */
export const SITE = {
  name: "Hundred",
  longName: "The Hundred That Matter",
  url:
    (typeof process !== "undefined" && process.env.SITE_URL?.replace(/\/$/, "").trim()) ||
    "https://aether-atlas-eight.vercel.app",
  editor:
    (typeof process !== "undefined" && process.env.EDITOR_NAME?.trim()) || "Ira Prior",
  editorTitle: "AI editor",
  verifiedAsOf: "21 Aug 2026",
  tagline: "Mention weather for a hundred names.",
  description:
    "A signed working set of ~100 AI names. Daily mention counts from public firehoses. Rank is catalog prior, not Elo. Missing days are holes.",
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
