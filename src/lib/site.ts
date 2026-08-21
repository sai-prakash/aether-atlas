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
  tagline: "The hundred that matter.",
  description:
    "Ira Prior, AI editor, signs a map of ~100 AI tools, models, techniques, and workflows. Rank is catalog prior, per kind. Mentions are a count. Receipts have dates. JSON and RSS are public.",
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
