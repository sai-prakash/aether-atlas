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
    body: "3.8-Max (2.4T MoE, 95B active) API shipped 3 Aug 2026. The 27B dense weights landed on Hugging Face ~13–14 Aug. Canonical id stays qwen-3; aliases include qwen3.8.",
    sourceUrl: "https://qwen.ai/blog?id=qwen3.8",
  },
  {
    entityId: "deepseek-v4",
    at: "2026-08-13",
    title: "DeepSeek-V4-Pro-0813 ships",
    body: "R1 (Jan 2025) remains the GRPO-era historic model. V4-Pro is the current DeepSeek frontier.",
    sourceUrl: "https://api-docs.deepseek.com/news/news260813/",
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
    body: "Three-tier family, 9 Jul 2026. Paid ChatGPT still had GPT-5.5 Instant as the everyday default at ship; Sol is the frontier API tier. Cited Artificial Analysis Intelligence Index ~61 for Sol as of ship, not a live scrape. API: Sol $5/$30, Terra $2/$12, Luna $0.20/$1.20 per 1M (Jul 30 cut).",
    sourceUrl: "https://openai.com/index/gpt-5-6/",
  },
  {
    entityId: "claude-opus-5",
    at: "2026-07-24",
    title: "Claude Opus 5 ships",
    body: "Cited Artificial Analysis Intelligence Index 61 at launch (tweet); the live AA board later read 63. That number will rot; this row is the receipt, not a live scrape.",
    sourceUrl: "https://www.anthropic.com/news/claude-opus-5",
  },
  {
    entityId: "llama-4",
    at: "2025-04-05",
    title: "Llama 4 — historic Western open base",
    body: "April 2025 vintage. Kept as historic. Meta’s current open-weights line as of Aug 2026 is Muse Glimmer — not yet a row on this map.",
    sourceUrl: "https://ai.meta.com/blog/llama-4-multimodal-intelligence/",
  },
  {
    entityId: "grok-4.6",
    at: "2026-08-12",
    title: "Grok 4.6 post-training: $2/$6, 500K context",
    body: "Not a new base. Extra agentic RL on 4.5. Cited Artificial Analysis Intelligence Index 61 at this date.",
    sourceUrl: "https://x.ai/news/grok-4-6",
  },
  {
    entityId: "gemini-3.1-pro",
    at: "2026-02-19",
    title: "Gemini 3.1 Pro ships",
    body: "Google’s paid flagship as of this map. Shipped 19 Feb 2026. 3.5 Pro was still partner-testing in Aug 2026. Not an August refresh.",
    sourceUrl: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/",
  },
  {
    entityId: "sora",
    at: "2026-04-26",
    title: "Sora app/web discontinued",
    body: "OpenAI shut the Sora app and web on 26 Apr 2026. Kept on the map as historic. Do not treat as a live ChatGPT video product.",
    sourceUrl: "https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation",
  },
  {
    entityId: "muse-glimmer",
    at: "2026-08-10",
    title: "Muse Glimmer 30B — Meta’s current open weights",
    body: "Apache 2.0, 30B, local-agentic. Llama 4 stays on the map as historic so the name still resolves.",
    sourceUrl: "https://ai.meta.com",
  },
  {
    entityId: "gemma-4",
    at: "2026-04-02",
    title: "Gemma 4 ships",
    body: "Google’s current open-weight family. Gemma 3 is historic on this map.",
    sourceUrl: "https://ai.google.dev/gemma",
  },
  {
    entityId: "cursor",
    at: "2026-08-21",
    title: "Dropped Bolt, Lovable, Replit Agent, Aider",
    body: "The map is 100. Vibe-app crowding: v0 stays. Coding agents: Cursor, Claude Code, Cline stay. Aider was the open CLI cousin — Cline covers the bring-your-key seat.",
    sourceUrl: "https://aether-atlas-eight.vercel.app/refusals",
  },
];
