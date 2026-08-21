import { SEED } from "@/lib/catalog/seed-data";

type Alias = { id: string; alias: string };

const ALIASES: Alias[] = SEED.flatMap((e) =>
  [...e.aliases, e.name, e.id]
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .map((alias) => ({ id: e.id, alias })),
).sort((a, b) => b.alias.length - a.alias.length);

const GENERIC = new Set([
  "ai",
  "llm",
  "model",
  "models",
  "agent",
  "agents",
  "openai",
  "google",
  "meta",
  "tools",
  "tool",
  "react",
  "sol",
  "r1",
  "mj",
]);

export function matchEntity(text: string): string {
  const hay = ` ${text.toLowerCase()} `;
  for (const { id, alias } of ALIASES) {
    if (GENERIC.has(alias) && alias.length < 5) continue;
    if (alias.length < 3) continue;
    if (hay.includes(` ${alias} `) || hay.includes(alias)) {
      // Prefer word-ish matches for short aliases
      if (alias.length < 5) {
        const re = new RegExp(`(^|[^a-z0-9])${escapeRe(alias)}([^a-z0-9]|$)`, "i");
        if (!re.test(text)) continue;
      }
      return id;
    }
  }
  return "";
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchMany(text: string): string[] {
  const hay = text.toLowerCase();
  const found = new Set<string>();
  for (const { id, alias } of ALIASES) {
    if (GENERIC.has(alias) && alias.length < 5) continue;
    if (alias.length < 4) continue;
    if (hay.includes(alias)) found.add(id);
    if (found.size >= 4) break;
  }
  return [...found];
}
