export type ChangelogSeed = {
  entityId: string;
  at: string;
  title: string;
  body: string;
  sourceUrl: string;
};

/** Dated receipts. Last-verified 21 Aug 2026. */
export const CHANGELOG_SEED: ChangelogSeed[] = [
  {
    entityId: "qwen-3",
    at: "2026-08-03",
    title: "Qwen3.8-Max (2.4T MoE) and Qwen 3.8 27B ship",
    body: "The Qwen3 line is no longer the current Alibaba open flagship. 3.8-Max is the frontier MoE; 27B is the dense workhorse. Atlas id stays qwen-3; aliases include qwen3.8.",
    sourceUrl: "https://www.marktechpost.com/",
  },
  {
    entityId: "deepseek-v4",
    at: "2026-08-13",
    title: "DeepSeek-V4-Pro-0813 ships",
    body: "R1 (Jan 2025) remains the GRPO-era historic model. V4-Pro is the current DeepSeek frontier.",
    sourceUrl: "https://www.aireleasetracker.com/",
  },
  {
    entityId: "deepseek-r1",
    at: "2025-01-20",
    title: "DeepSeek-R1 open reasoner (historic)",
    body: "Kept on the map as the model that popularized GRPO-style post-training. Not the current DeepSeek release.",
    sourceUrl: "https://arxiv.org/abs/2501.12948",
  },
  {
    entityId: "gpt-5.6",
    at: "2026-07-09",
    title: "GPT-5.6 ships as Sol / Terra / Luna",
    body: "Not one model. Three-tier family became ChatGPT default on 9 Jul 2026. Sol is the intelligence-index reference (~61).",
    sourceUrl: "https://openai.com/",
  },
  {
    entityId: "claude-opus-5",
    at: "2026-07-24",
    title: "Claude Opus 5 ships; AA Intelligence 63 at launch",
    body: "Cited Artificial Analysis figure at ship date, not a live scrape. That number will rot; the changelog is the receipt.",
    sourceUrl: "https://www.anthropic.com/news/claude-opus-5",
  },
  {
    entityId: "llama-4",
    at: "2025-04-05",
    title: "Llama 4 — Meta’s current open generation",
    body: "April 2025 vintage. Still the default Western open base in this map, dated so it cannot pose as a 2026 launch.",
    sourceUrl: "https://www.llama.com",
  },
  {
    entityId: "grok-4.6",
    at: "2026-08-12",
    title: "Grok 4.6 post-training: Intelligence 61 at $2/$6",
    body: "Not a new base. Extra agentic RL on 4.5. Cited AA Intelligence 61 at this date.",
    sourceUrl: "https://x.ai",
  },
  {
    entityId: "gemini-3.1-pro",
    at: "2026-08-01",
    title: "Gemini 3.1 family refresh",
    body: "Google’s paid flagship line as of early August 2026. Verify against DeepMind notes before treating as SOTA.",
    sourceUrl: "https://deepmind.google",
  },
];
