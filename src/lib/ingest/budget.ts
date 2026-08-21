/** Hosting budget for the observatory. Tuned for Vercel Hobby + Neon scale-to-zero. */
export const PULSE = {
  /** Daily cron (Hobby allows one cron, once per day). */
  cronExpr: "15 6 * * *",
  /** Skip a manual pulse if the last successful run is newer than this. */
  minManualMs: 12 * 60 * 60 * 1000,
  /** Skip cron / public /api/cron if the last successful run is newer than this. */
  minCronMs: 20 * 60 * 60 * 1000,
  /** Treat a `running` row older than this as a crashed lock. */
  staleLockMs: 5 * 60 * 1000,
  /** In-process memo for a warm serverless isolate. */
  memTtlMs: 15 * 60 * 1000,
  snapshotDays: 45,
  signalDays: 30,
  insightHours: 24,
  ingestRunDays: 30,
  fetchBudgetMs: 7000,
} as const;

export type CostLine = {
  id: string;
  vendor: string;
  plan: string;
  typicalUsd: number;
  cap: string;
  use: string;
  note: string;
};

/**
 * Estimated monthly run-rate for this architecture on free tiers.
 * List prices as of August 2026. Not an invoice — quotas can change.
 */
export const MONTHLY_COST = {
  asOf: "August 2026",
  typicalUsd: 0,
  withDailyBriefUsd: 0.18,
  assumption: "~2,000 visits, 1 cron/day, briefs only when requested",
  lines: [
    {
      id: "vercel",
      vendor: "Vercel",
      plan: "Hobby",
      typicalUsd: 0,
      cap: "1M invocations · 4 CPU-hrs · 100 GB transfer",
      use: "~3–8k invocations · ~0.1 CPU-hrs · <2 GB",
      note: "SSR + one daily cron. Hobby caps; no overage bill — the app pauses if a cap is hit.",
    },
    {
      id: "neon",
      vendor: "Neon",
      plan: "Free",
      typicalUsd: 0,
      cap: "100 CU-hrs · 0.5 GB storage · scale-to-zero",
      use: "~5–20 CU-hrs · ~5 MB",
      note: "One snapshot row. Compute sleeps after 5 minutes idle. Catalog + 45-day history stays well under storage.",
    },
    {
      id: "firehose",
      vendor: "Firehoses",
      plan: "Public APIs",
      typicalUsd: 0,
      cap: "Provider rate limits only",
      use: "1 pulse/day · HN, arXiv, HF, Reddit, RSS",
      note: "No paid keys. GitHub search is skipped unless a token is present.",
    },
    {
      id: "grok",
      vendor: "xAI",
      plan: "Grok 4.5 API",
      typicalUsd: 0.18,
      cap: "Pay-as-you-go · $2 / $6 per 1M in/out",
      use: "~1.8k in + 0.4k out per brief · cached 24h",
      note: "User-initiated only. $0 if unused. ~$0.006 per brief, ~$0.18 if run daily for a month.",
    },
  ] satisfies CostLine[],
} as const;
