import { matchEntity } from "./match";
import type { SourceStatus } from "@/lib/catalog/types";
import type { CitedMark } from "@/lib/catalog/lens";
import { PULSE } from "./budget";

type AaRow = { name: string; slug: string; intelligence: number };

/**
 * Artificial Analysis — cited, never folded into catalog prior.
 * Prefer AA_API_KEY. If unset, parse the public /models page JSON-LD
 * (isAccessibleForFree) so the Lens column is not silently empty.
 */
export async function fetchCitedAa(): Promise<{
  status: SourceStatus;
  ranks: Record<string, CitedMark>;
}> {
  const key =
    (typeof process !== "undefined" &&
      (process.env.AA_API_KEY ?? process.env.ARTIFICIAL_ANALYSIS_API_KEY)?.trim()) ||
    "";

  if (key) {
    try {
      const res = await fetch("https://artificialanalysis.ai/api/v2/language/models/free", {
        headers: { "x-api-key": key, Accept: "application/json", "User-Agent": "Hundred/1.0" },
        signal: AbortSignal.timeout(PULSE.fetchBudgetMs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as unknown;
      const ranks = rowsToRanks(extractAaRows(body), "API");
      if (Object.keys(ranks).length) {
        return { status: { source: "aa", ok: true, count: Object.keys(ranks).length }, ranks };
      }
    } catch {
      // Fall through to the public page.
    }
  }

  try {
    const res = await fetch("https://artificialanalysis.ai/models", {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; Hundred/1.0; +https://thehundred.ai)",
      },
      signal: AbortSignal.timeout(PULSE.fetchBudgetMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const rows = parseAaLeaderboard(html);
    const ranks = rowsToRanks(rows, "public page");
    if (!Object.keys(ranks).length) throw new Error("no models on public page");
    return { status: { source: "aa", ok: true, count: Object.keys(ranks).length }, ranks };
  } catch (err) {
    const message = err instanceof Error ? err.message : "aa failed";
    return {
      status: {
        source: "aa",
        ok: false,
        count: 0,
        error: key ? message.slice(0, 180) : `skipped (${message.slice(0, 120)})`,
        optional: true,
      },
      ranks: {},
    };
  }
}

export function parseAaLeaderboard(html: string): AaRow[] {
  const out: AaRow[] = [];
  const re = /\{"label":"([^"]+)","intelligenceIndex":([0-9.]+),"detailsUrl":"([^"]+)"\}/g;
  for (const m of html.matchAll(re)) {
    const intelligence = Number(m[2]);
    if (!Number.isFinite(intelligence)) continue;
    out.push({ name: m[1], slug: m[3].replace(/^\/models\//, ""), intelligence });
  }
  return out;
}

function rowsToRanks(rows: AaRow[], via: string): Record<string, CitedMark> {
  const ranked = [...rows].sort((a, b) => b.intelligence - a.intelligence);
  const ranks: Record<string, CitedMark> = {};
  ranked.forEach((row, i) => {
    const entityId = matchEntity(`${row.name} ${row.slug}`);
    if (!entityId || ranks[entityId]) return;
    ranks[entityId] = {
      entityId,
      rank: i + 1,
      value: row.intelligence,
      label: `Artificial Analysis Intelligence ${row.intelligence.toFixed(0)} (${via}, cited)`,
    };
  });
  return ranks;
}

function extractAaRows(body: unknown): AaRow[] {
  const root = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const list = Array.isArray(body)
    ? body
    : Array.isArray(root.data)
      ? root.data
      : Array.isArray(root.models)
        ? root.models
        : [];
  const out: AaRow[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const name = String(r.name ?? r.model_name ?? r.slug ?? "").trim();
    if (!name) continue;
    const intelligence = Number(
      r.artificial_analysis_intelligence_index ?? r.intelligence_index ?? r.intelligence ?? r.score,
    );
    if (!Number.isFinite(intelligence)) continue;
    out.push({ name, slug: String(r.slug ?? name), intelligence });
  }
  return out;
}
