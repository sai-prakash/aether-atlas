# AETHER

A living atlas of AI — tools, models, papers, techniques, workflows, and rankings from public firehoses. One daily pulse, then the desk sleeps.

**Typical month: $0 to host. About $0.18 if a brief runs every day.**

[Observatory](#what-it-is) · [Deploy](#deploy-on-the-free-tier) · [Cost](#estimated-month) · [How it works](#how-the-desk-works)

## What it is

Aether is an observatory, not a directory dump.

- **Observatory** — Aether Index, movers, live signals, daily brief
- **Atlas** — every entity by kind, license, category
- **Rankings / Drift** — 24h / 7d / 30d windows and rank change
- **Signals / Papers / Methods** — firehose, arXiv, techniques and workflows
- **Compare** — up to three entities side by side
- **⌘K** — jump anywhere

Sources: Hacker News, arXiv, Hugging Face models + Daily Papers, Reddit, lab RSS. GitHub only when a token is present. Optional Artificial Analysis (cited, never folded into the index). Discord is closed; X has no free firehose — those rooms are not faked.

The Lens is the product that directories and eval boards will not ship: disagreement across cited ranks, technique lineage, and open-source displacement.

## Deploy on the free tier

One click: clones this repo, creates a Vercel Hobby project, and provisions a Neon Free database (`DATABASE_URL` is injected). No paid APIs required.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sai-prakash/aether-atlas&project-name=aether-atlas&repository-name=aether-atlas&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

After deploy:

1. Confirm `STORAGE_URL` or `DATABASE_URL` is set (Vercel Storage / Neon injects one of these). If the live site says **the ledger is missing**, add Neon Free under Vercel → Storage, then **Redeploy**.
2. Optional: add `XAI_API_KEY` for on-demand daily briefs (cached 24h).
3. Optional: add `CRON_SECRET` so `/api/cron` is not world-callable. Vercel Cron sends it automatically.
4. First visit seeds the catalog. The daily cron (`06:15 UTC`) pulses the firehoses.

Hobby allows **one cron per project**. That is why the desk pulses once a day, not every few hours.

If Vercel asks for an **Application / Framework Preset**, choose **TanStack Start**. The repo pins it in `vercel.json` (`"framework": "tanstack-start"`). Leave build command and output directory as detected.

## Estimated month

List prices as of August 2026. Assumes ~2,000 visits and one cron/day. Not an invoice.

| Line | Plan | This desk | $/mo |
|---|---|---|---|
| Vercel | Hobby | ~3–8k invocations · ~0.1 CPU-hrs · <2 GB | $0 |
| Neon | Free | ~5–20 CU-hrs · ~5 MB · scale-to-zero | $0 |
| Firehoses | Public APIs | HN, arXiv, HF, Reddit, RSS | $0 |
| xAI brief | Grok 4.5, on-demand | ~$0.006 each · cached 24h | $0–$0.18 |

Hobby and Free **cap** instead of billing overage. The architecture (pulse → materialize → sleep) is built to stay inside those caps.

## How the desk works

1. **Pulse** — Daily cron pulls HN, arXiv, Hugging Face, Reddit, and lab RSS in parallel, with a hard time budget.
2. **Materialize** — Scores, ranks, sparklines, and the feed land in one snapshot row. Old signals are pruned.
3. **Sleep** — Every page reads that snapshot. Visitors never wake the firehoses. Neon scales to zero between pulses.

Aether Index = catalog prior + live mention velocity + public social (GitHub/HF) + recency. Failed sources are marked failed, not guessed.

## Env

| Var | Required | Purpose |
|---|---|---|
| `STORAGE_URL` or `DATABASE_URL` | In production | Neon pooled connection (Vercel Storage uses `STORAGE_URL`). Unset → embedded PGLite (local only). |
| `XAI_API_KEY` | No | On-demand daily brief. $0 if unused. |
| `CRON_SECRET` | Recommended | Protects `/api/cron`. |
| `GITHUB_TOKEN` | No | Enables GitHub search during the pulse. |
| `AA_API_KEY` | No | Cites Artificial Analysis Intelligence ranks in the Lens. Attribution required. $0 on their free tier. |

Do not commit secrets. Never put non-`VITE_` vars in client code.

## Stack

TanStack Start · React 19 · Tailwind v4 · Neon Postgres (PGLite in preview) · Vercel Cron · public firehoses · optional xAI brief.

## License

MIT.
