import { SEED } from "@/lib/catalog/seed-data";
import type { Kind } from "@/lib/catalog/types";

type Alias = { id: string; alias: string; kind: Kind };

const ALIASES: Alias[] = SEED.flatMap((e) =>
  [...e.aliases, e.name, e.id]
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .map((alias) => ({ id: e.id, alias, kind: e.kind })),
).sort((a, b) => b.alias.length - a.alias.length);

/** Vocabulary of cs.AI — matching these is measuring the corpus, not importance. */
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
  "transformer",
  "diffusion",
  "attention",
  "rag",
  "reasoning",
  "training",
  "language",
  "network",
  "networks",
  "paper",
  "survey",
  "data",
  "learning",
  "image",
  "video",
  "audio",
  "chat",
  "code",
  "coding",
]);

const PAPER_SOURCES = new Set(["arxiv", "hf-papers"]);

export function matchEntity(text: string, source?: string): string {
  const skipMethods = Boolean(source && PAPER_SOURCES.has(source));
  for (const { id, alias, kind } of ALIASES) {
    if (GENERIC.has(alias)) continue;
    if (alias.length < 3) continue;
    if (skipMethods && (kind === "technique" || kind === "workflow" || kind === "protocol")) continue;
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(alias)}([^a-z0-9]|$)`, "i");
    if (re.test(text)) return id;
  }
  return "";
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchMany(text: string, source?: string): string[] {
  const skipMethods = Boolean(source && PAPER_SOURCES.has(source));
  const found = new Set<string>();
  for (const { id, alias, kind } of ALIASES) {
    if (GENERIC.has(alias)) continue;
    if (alias.length < 4) continue;
    if (skipMethods && (kind === "technique" || kind === "workflow" || kind === "protocol")) continue;
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(alias)}([^a-z0-9]|$)`, "i");
    if (re.test(text)) found.add(id);
    if (found.size >= 4) break;
  }
  return [...found];
}
