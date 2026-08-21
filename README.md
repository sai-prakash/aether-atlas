# Hundred

**The hundred that matter.** A signed editorial map of ~100 AI tools, models, techniques, and workflows — dated receipts, per-kind rank, open JSON.

TAAFT ranks by votes. Arena ranks models with Bradley-Terry. This desk cites both and absorbs neither. Rank is catalog prior. Mentions are weather.

Working title: Hundred. Domain later. Do not buy hundred.org (HundrED).

## Product

- **Observatory** — map by kind, receipts
- **Rankings** — per-kind editorial prior (no cross-kind board)
- **This week** — dated receipts
- **Lens** — disagreement / lineage / displacement
- **JSON** · **RSS** · **sitemap**

## Deploy

Env: `STORAGE_URL` or `DATABASE_URL` (Neon). Required for cron: `CRON_SECRET`. Optional: `SITE_URL`, `EDITOR_NAME`, `GITHUB_TOKEN`, `AA_API_KEY`, `XAI_API_KEY`, `EDITOR_TOKEN` (manual pulse).

One daily cron (`/api/cron`). Fail-closed without `CRON_SECRET` (Vercel cron header still allowed). Visitors never trigger the firehoses.

## Cost

Vercel Hobby + Neon Free + public firehoses = **$0**.
