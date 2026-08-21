import { matchEntity } from "./match";
import type { SourceStatus } from "@/lib/catalog/types";
import type { CitedMark } from "@/lib/catalog/lens";
import { PULSE } from "./budget";

/**
 * Optional Artificial Analysis free-tier ingest.
 * Cited, never folded into the map rank. Requires AA_API_KEY.
 * Attribution: Artificial Analysis (https://artificialanalysis.ai).
 */
export async function fetchCitedAa(): Promise<{
  status: SourceStatus;
  ranks: Record<string, CitedMark>;
}> {
  const key =
    (typeof process !== "undefined" &&
      (process.env.AA_API_KEY ?? process.env.ARTIFICIAL_ANALYSIS_API_KEY)?.trim()) ||
    "";
  if (!key) {
    return {
      status: { source: "aa", ok: false, count: 0, error: "skipped (no AA_API_KEY)" },
      ranks: {},
    };
  }

  try {
    const res = await fetch("https://artificialanalysis.ai/api/v2/language/models/free", {
      headers: { "x-api-key": key, Accept: "application/json", "User-Agent": "Hundred/1.0" },
      signal: AbortSignal.timeout(PULSE.fetchBudgetMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as unknown;
    const rows = extractAaRows(body);
    const ranked = [...rows].sort((a, b) => b.intelligence - a.intelligence);
    const ranks: Record<string, CitedMark> = {};
    ranked.forEach((row, i) => {
      const entityId = matchEntity(`${row.name} ${row.slug}`);
      if (!entityId || ranks[entityId]) return;
      ranks[entityId] = {
        entityId,
        rank: i + 1,
        value: row.intelligence,
        label: `AA Intelligence ${row.intelligence}`,
      };
    });
    return { status: { source: "aa", ok: true, count: Object.keys(ranks).length }, ranks };
  } catch (err) {
    const message = err instanceof Error ? err.message : "aa failed";
    return { status: { source: "aa", ok: false, count: 0, error: message.slice(0, 180) }, ranks: {} };
  }
}

type AaRow = { name: string; slug: string; intelligence: number };

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
