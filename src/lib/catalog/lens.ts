import type {
  CitedMark,
  Displacement,
  Disagreement,
  Entity,
  Lens,
  Lineage,
  Signal,
  BoardRank,
} from "./types";

export type { CitedMark, Lens, Lineage, Displacement, Disagreement };

export const BOARD_LABEL: Record<BoardRank["board"], string> = {
  catalog: "Catalog prior",
  mentions: "Firehose",
  papers: "Papers",
  aa: "Artificial Analysis",
};

const PAPER_SOURCES = new Set(["arxiv", "hf-papers"]);

function rankBy(ids: string[], scoreOf: (id: string) => number): Map<string, number> {
  const sorted = [...ids].sort((a, b) => scoreOf(b) - scoreOf(a));
  const out = new Map<string, number>();
  sorted.forEach((id, i) => out.set(id, i + 1));
  return out;
}

/** The join no directory, eval board, or newsletter will ship: cited columns, technique lineage, OSS displacement. */
export function buildLens(
  entities: Entity[],
  signals: Signal[],
  citedAa: Record<string, CitedMark> = {},
): Lens {
  const byId = new Map(entities.map((e) => [e.id, e]));
  const ids = entities.map((e) => e.id);

  const catalog = rankBy(ids, (id) => byId.get(id)?.catalogWeight ?? 0);
  const mentions = rankBy(ids, (id) => {
    const e = byId.get(id);
    return (e?.mentions24h ?? 0) * 3 + (e?.mentions7d ?? 0);
  });

  const paperHeat = new Map<string, number>();
  for (const s of signals) {
    if (!s.entityId || !PAPER_SOURCES.has(s.source)) continue;
    paperHeat.set(s.entityId, (paperHeat.get(s.entityId) ?? 0) + 1 + Math.log1p(s.score));
  }
  const paperIds = [...paperHeat.keys()].filter((id) => byId.has(id));
  const papers = rankBy(paperIds, (id) => paperHeat.get(id) ?? 0);

  const disagreements: Disagreement[] = [];
  for (const e of entities) {
    const boards: BoardRank[] = [];
    const c = catalog.get(e.id);
    if (c) boards.push({ board: "catalog", rank: c, value: e.catalogWeight, label: `prior ${e.catalogWeight}` });
    const m = mentions.get(e.id);
    if (m && (e.mentions24h > 0 || e.mentions7d > 0)) {
      boards.push({
        board: "mentions",
        rank: m,
        value: e.mentions7d,
        label: `${e.mentions7d} mentions / 7d`,
      });
    }
    const p = papers.get(e.id);
    if (p) {
      boards.push({
        board: "papers",
        rank: p,
        value: paperHeat.get(e.id) ?? 0,
        label: `${Math.round(paperHeat.get(e.id) ?? 0)} paper heat`,
      });
    }
    const aa = citedAa[e.id];
    if (aa) {
      boards.push({ board: "aa", rank: aa.rank, value: aa.value, label: aa.label });
    }
    if (boards.length < 2) continue;
    const ranks = boards.map((b) => b.rank);
    const spread = Math.max(...ranks) - Math.min(...ranks);
    if (spread < 4) continue;
    disagreements.push({ entity: e, boards, spread });
  }
  disagreements.sort((a, b) => b.spread - a.spread);

  const lineage: Lineage[] = entities
    .filter((e) => e.kind === "technique" || e.kind === "protocol" || e.kind === "workflow")
    .map((technique) => ({
      technique,
      usedBy: entities.filter(
        (e) => e.id !== technique.id && e.techniques.includes(technique.id),
      ),
    }))
    .filter((row) => row.usedBy.length > 0)
    .sort((a, b) => b.usedBy.length - a.usedBy.length);

  const displacement: Displacement[] = [];
  const cats = new Set(entities.flatMap((e) => e.categories));
  for (const category of cats) {
    const pool = entities.filter(
      (e) => (e.kind === "tool" || e.kind === "model") && e.categories.includes(category),
    );
    const commercial = pool
      .filter((e) => e.license === "commercial")
      .sort((a, b) => b.mentions7d - a.mentions7d)[0];
    const open = pool
      .filter((e) => e.license === "open-source")
      .sort((a, b) => b.mentions7d - a.mentions7d)[0];
    if (!commercial || !open) continue;
    const mentionGap = open.mentions7d - commercial.mentions7d;
    if (open.mentions7d + commercial.mentions7d < 1) continue;
    displacement.push({ category, commercial, open, mentionGap });
  }
  displacement.sort((a, b) => b.mentionGap - a.mentionGap);

  return {
    disagreements: disagreements.slice(0, 12),
    lineage: lineage.slice(0, 16),
    displacement: displacement.slice(0, 8),
  };
}

export function lineageFor(entity: Entity, all: Entity[]): { uses: Entity[]; usedBy: Entity[] } {
  const uses = entity.techniques
    .map((id) => all.find((e) => e.id === id))
    .filter((e): e is Entity => Boolean(e));
  const usedBy = all.filter((e) => e.id !== entity.id && e.techniques.includes(entity.id));
  return { uses, usedBy };
}
