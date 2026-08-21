/** Public identity of the desk. Override URL/editor via env — never invent traffic. */
export const SITE = {
  name: "AETHER",
  url:
    (typeof process !== "undefined" && process.env.SITE_URL?.replace(/\/$/, "").trim()) ||
    "https://aether-atlas-eight.vercel.app",
  editor:
    (typeof process !== "undefined" && process.env.EDITOR_NAME?.trim()) || "Aether desk",
  verifiedAsOf: "21 Aug 2026",
  tagline: "The hundred that matter.",
  description:
    "A signed editorial map of ~100 AI tools, models, techniques, and workflows. Rank is catalog prior, per kind. Heat is a mention count. Receipts have dates. JSON and RSS are public.",
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
