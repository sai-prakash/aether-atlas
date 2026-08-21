export const KINDS = [
  "tool",
  "model",
  "paper",
  "technique",
  "workflow",
  "lab",
  "protocol",
] as const;

export type Kind = (typeof KINDS)[number];

export const LICENSES = ["commercial", "open-source", "research", "mixed"] as const;
export type License = (typeof LICENSES)[number];

export const WINDOWS = ["24h", "7d", "30d"] as const;
export type TimeWindow = (typeof WINDOWS)[number];

export const CATEGORIES = [
  "chat",
  "coding",
  "image",
  "video",
  "audio",
  "search",
  "agents",
  "local",
  "infra",
  "data",
  "eval",
  "research",
  "automation",
  "open-models",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type EntityStatus = "active" | "deprecated" | "historic";

export type EntitySpec = {
  contextK?: number;
  priceIn?: number;
  priceOut?: number;
  selfHost?: boolean;
};

export type SeedEntity = {
  id: string;
  kind: Kind;
  name: string;
  tagline: string;
  description: string;
  license: License;
  vendor: string;
  website: string;
  github?: string;
  paper_url?: string;
  categories: string[];
  techniques: string[];
  features: string[];
  pricing: string;
  catalog_weight: number;
  aliases: string[];
  trend?: number;
  status?: EntityStatus;
  verified?: string;
  spec?: EntitySpec;
};

export type Entity = {
  id: string;
  kind: Kind;
  name: string;
  tagline: string;
  description: string;
  license: License;
  vendor: string;
  website: string;
  github: string;
  paperUrl: string;
  categories: string[];
  techniques: string[];
  features: string[];
  pricing: string;
  catalogWeight: number;
  aliases: string[];
  score: number;
  momentum: number;
  mentions24h: number;
  mentions7d: number;
  githubStars: number;
  hfDownloads: number;
  lastSeen: string | null;
  rank: number;
  prevRank: number | null;
  spark: number[];
  status: EntityStatus;
  verifiedAt: string | null;
  spec: EntitySpec;
  kindRank: number;
};

export type Signal = {
  id: number;
  source: string;
  title: string;
  url: string;
  snippet: string;
  entityId: string;
  score: number;
  publishedAt: string | null;
  ingestedAt: string;
};

export type Insight = {
  id: number;
  period: string;
  title: string;
  body: string;
  generatedAt: string;
};

export type SourceStatus = {
  source: string;
  ok: boolean;
  count: number;
  error?: string;
};

export type IngestStatus = {
  id: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  status: string;
  sources: SourceStatus[];
  stats: Record<string, number>;
};

export type SnapPoint = {
  at: string;
  score: number;
  rank: number;
  mentions: number;
};

export type RankMark = {
  rank: number;
  score: number;
};

export type ChangelogEntry = {
  entityId: string;
  entityName: string;
  at: string;
  title: string;
  body: string;
  sourceUrl: string;
};

export type Mover = {
  entity: Entity;
  delta: number;
  rankDelta: number;
};

export type CitedMark = {
  entityId: string;
  rank: number;
  value: number;
  label: string;
};

export type BoardId = "catalog" | "mentions" | "papers" | "aa";

export type BoardRank = {
  board: BoardId;
  rank: number;
  value: number;
  label: string;
};

export type Disagreement = {
  entity: Entity;
  boards: BoardRank[];
  spread: number;
};

export type Lineage = {
  technique: Entity;
  usedBy: Entity[];
};

export type Displacement = {
  category: string;
  commercial: Entity;
  open: Entity;
  mentionGap: number;
};

export type Lens = {
  disagreements: Disagreement[];
  lineage: Lineage[];
  displacement: Displacement[];
};

export type Dashboard = {
  generatedAt: string;
  window: TimeWindow;
  totals: {
    entities: number;
    tools: number;
    models: number;
    papers: number;
    techniques: number;
    signals24h: number;
    signals7d: number;
  };
  ingest: IngestStatus;
  leaders: Entity[];
  movers: Mover[];
  losers: Mover[];
  byCategory: { category: string; count: number; avgScore: number }[];
  licenseSplit: { license: string; count: number; avgScore: number }[];
  signals: Signal[];
  insight: Insight | null;
  lens: Lens;
  health: import("./health").IndexHealth;
  changelog: ChangelogEntry[];
  byKind: { kind: Kind; leaders: Entity[] }[];
};

export type PulsePayload = {
  builtAt: string;
  ingest: IngestStatus;
  totals: Dashboard["totals"];
  entities: Entity[];
  prev: Record<TimeWindow, Record<string, RankMark>>;
  signals: Signal[];
  insight: Insight | null;
  snapshots: Record<string, SnapPoint[]>;
  byCategory: Dashboard["byCategory"];
  licenseSplit: Dashboard["licenseSplit"];
  citedAa?: Record<string, CitedMark>;
  changelog?: ChangelogEntry[];
};


export const KIND_LABEL: Record<Kind, string> = {
  tool: "Tool",
  model: "Model",
  paper: "Paper",
  technique: "Technique",
  workflow: "Workflow",
  lab: "Lab",
  protocol: "Protocol",
};

export const LICENSE_LABEL: Record<License, string> = {
  commercial: "Commercial",
  "open-source": "Open source",
  research: "Research",
  mixed: "Mixed",
};

export const CATEGORY_LABEL: Record<string, string> = {
  chat: "Chat",
  coding: "Coding",
  image: "Image",
  video: "Video",
  audio: "Audio",
  search: "Search",
  agents: "Agents",
  local: "Local",
  infra: "Infra",
  data: "Data",
  eval: "Eval",
  research: "Research",
  automation: "Automation",
  "open-models": "Open models",
};

export const SOURCE_LABEL: Record<string, string> = {
  hn: "Hacker News",
  arxiv: "arXiv",
  hf: "Hugging Face",
  "hf-papers": "HF Daily Papers",
  github: "GitHub",
  reddit: "Reddit",
  rss: "Labs RSS",
  aa: "Artificial Analysis",
};
