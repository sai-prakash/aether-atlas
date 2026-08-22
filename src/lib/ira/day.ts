import { indexHealth, LIVE_NEEDED } from "@/lib/catalog/health";
import type { ChangelogEntry, Entity, PulsePayload, SourceStatus } from "@/lib/catalog/types";
import { SITE } from "@/lib/site";

export type DayMover = {
  id: string;
  name: string;
  kind: string;
  mentions: number;
  prev: number | null;
};

export type DayRecord = {
  day: string;
  builtAt: string;
  schema: number;
  cores: { live: number; needed: number; status: string };
  sources: Pick<SourceStatus, "source" | "ok" | "count">[];
  gap: boolean;
  n: number;
  movers: DayMover[];
  fades: DayMover[];
  attention: { id: string; mentions: number }[];
  citedAa: { id: string; label: string }[];
  receipts: { at: string; title: string; entityId: string }[];
  unresolved: number;
  letter: { title: string; dek: string; body: string; mode: "gap" | "machine" };
};

const MIN_MENTIONS = 3;

function utcDay(iso = new Date().toISOString()): string {
  return iso.slice(0, 10);
}

/** Mentions vs yesterday's closed day. Spark is intra-day and must not be used. */
export function movement(
  entities: Entity[],
  prevById?: Record<string, number>,
): { movers: DayMover[]; fades: DayMover[] } {
  const rows: DayMover[] = entities
    .filter((e) => e.status !== "deprecated")
    .map((e) => ({
      id: e.id,
      name: e.name,
      kind: e.kind,
      mentions: e.mentions24h,
      prev: prevById && Object.prototype.hasOwnProperty.call(prevById, e.id) ? prevById[e.id] : null,
    }));

  const hasYesterday = Boolean(prevById && Object.keys(prevById).length);

  if (!hasYesterday) {
    return {
      movers: rows
        .filter((r) => r.mentions >= MIN_MENTIONS)
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 8),
      fades: [],
    };
  }

  const movers = rows
    .filter((r) => {
      if (r.mentions < MIN_MENTIONS) return false;
      if (r.prev == null) return true;
      return r.mentions - r.prev >= MIN_MENTIONS;
    })
    .sort((a, b) => b.mentions - (b.prev ?? 0) - (a.mentions - (a.prev ?? 0)))
    .slice(0, 8);

  const fades = rows
    .filter((r) => r.prev != null && r.prev >= MIN_MENTIONS && r.prev - r.mentions >= MIN_MENTIONS)
    .sort((a, b) => (b.prev ?? 0) - b.mentions - ((a.prev ?? 0) - a.mentions))
    .slice(0, 6);

  return { movers, fades };
}

export const DAY_SCHEMA = 2;

export function buildDay(
  pulse: PulsePayload,
  unresolved: number,
  prevById?: Record<string, number>,
  dayCounts?: Record<string, number>,
): DayRecord {
  const day = utcDay(pulse.builtAt);
  const health = indexHealth(pulse.ingest.sources ?? []);
  const gap = health.status !== "live";
  const counted = dayCounts
    ? pulse.entities.map((e) => ({ ...e, mentions24h: dayCounts[e.id] ?? 0 }))
    : pulse.entities;
  const { movers, fades } = gap ? { movers: [], fades: [] } : movement(counted, prevById);
  const attention = counted
    .filter((e) => e.mentions24h > 0)
    .map((e) => ({ id: e.id, mentions: e.mentions24h }));
  const receipts = (pulse.changelog ?? [])
    .filter((c) => c.at.slice(0, 10) === day)
    .slice(0, 8)
    .map((c: ChangelogEntry) => ({
      at: c.at.slice(0, 10),
      title: c.title,
      entityId: c.entityId,
    }));
  const citedAa = Object.entries(pulse.citedAa ?? {}).map(([id, m]) => ({ id, label: m.label }));
  const sources = (pulse.ingest.sources ?? []).map((s) => ({
    source: s.source,
    ok: s.ok,
    count: s.count,
  }));
  const record: DayRecord = {
    day,
    builtAt: pulse.builtAt,
    schema: DAY_SCHEMA,
    cores: { live: health.live, needed: LIVE_NEEDED, status: health.status },
    sources,
    gap,
    n: pulse.entities.length,
    movers,
    fades,
    attention,
    citedAa,
    receipts,
    unresolved,
    letter: { title: "", dek: "", body: "", mode: gap ? "gap" : "machine" },
  };
  record.letter = letterFrom(record);
  return record;
}

/** Deterministic. No LLM. Every proper noun is already on the map or in a receipt. */
export function letterFrom(day: DayRecord): DayRecord["letter"] {
  if (day.gap) {
    return {
      mode: "gap",
      title: `Gap — ${day.day}`,
      dek: `${day.cores.live} of ${day.cores.needed} core firehoses. No movement claims.`,
      body: [
        `I am ${SITE.editor}. I did not measure the field today.`,
        `Cores live: ${day.cores.live}/${day.cores.needed}. Status: ${day.cores.status}.`,
        `This date is a hole in the archive. I will not fill it with zeros or with yesterday.`,
        `The set is still ${day.n}. I did not add or drop names.`,
        `— ${SITE.editor}, machine letter, ${day.day}`,
      ].join("\n\n"),
    };
  }

  const up = day.movers
    .slice(0, 5)
    .map((m) => `${m.name} ${m.mentions} mentions` + (m.prev != null ? ` (was ${m.prev})` : ""))
    .join("; ");
  const down = day.fades
    .slice(0, 4)
    .map((m) => `${m.name} ${m.mentions} (was ${m.prev})`)
    .join("; ");
  const rec = day.receipts
    .slice(0, 5)
    .map((r) => `${r.at} · ${r.title}`)
    .join("\n");
  const dropped = day.receipts.some((r) => /^dropped /i.test(r.title));

  const lines = [
    `I am ${SITE.editor}. These are mention counts published on ${day.day}, on a working set of ${day.n}, not quality.`,
    up ? `What the field looked at: ${up}.` : "No name cleared the mention floor today.",
    down ? `Cooling: ${down}.` : "",
    rec ? `Receipts:\n${rec}` : "No new dated receipts.",
    `Unresolved titles (not on the map): ${day.unresolved}. I do not auto-add names.`,
    dropped
      ? `I dropped names today. The set is still ${day.n}.`
      : `Cores ${day.cores.live}/${day.cores.needed}. I did not add or drop names today.`,
    `— ${SITE.editor}, machine letter, ${day.day}`,
  ].filter(Boolean);

  const lead = day.movers[0];
  return {
    mode: "machine",
    title: lead ? `${lead.name} led mentions — ${day.day}` : `Quiet day — ${day.day}`,
    dek: `Attention, not quality. ${day.cores.live} core firehoses.`,
    body: lines.join("\n\n"),
  };
}
