/**
 * Brand lock, 21 Aug 2026.
 *
 * Hundred — the hundred that matter.
 * Not Aether (vapor, crypto-collides). Not Atlas (OpenAI’s browser).
 *
 * Domain to buy today, in order:
 *   1. thehundred.ai
 *   2. hundredthatmatter.com
 * Then set SITE_URL to https://thehundred.ai
 *
 * Do not buy hundred.org — that is HundrED, an education NGO.
 */
export const SITE = {
  name: "Hundred",
  longName: "The Hundred That Matter",
  url:
    (typeof process !== "undefined" && process.env.SITE_URL?.replace(/\/$/, "").trim()) ||
    "https://aether-atlas-eight.vercel.app",
  editor:
    (typeof process !== "undefined" && process.env.EDITOR_NAME?.trim()) || "Hundred",
  verifiedAsOf: "21 Aug 2026",
  tagline: "The hundred that matter.",
  description:
    "A signed editorial map of ~100 AI tools, models, techniques, and workflows. Rank is catalog prior, per kind. Heat is a mention count. Receipts have dates. JSON and RSS are public.",
  domains: {
    primary: "thehundred.ai",
    backup: "hundredthatmatter.com",
    avoid: "hundred.org",
  },
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
