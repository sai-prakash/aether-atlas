# Hundred

**The hundred that matter.** A signed editorial map of ~100 AI tools, models, techniques, and workflows — dated receipts, per-kind rank, open JSON. Not a directory. Not a live composite index.

## Name

| | |
|---|---|
| Brand | **Hundred** |
| Long | The Hundred That Matter |
| Buy today | **thehundred.ai** (primary), **hundredthatmatter.com** (backup) |
| Do not buy | hundred.org — [HundrED](https://hundred.org), education NGO |
| Kill | Aether (vapor, crypto). Atlas (OpenAI’s browser). |

After purchase: Vercel → Domains → add `thehundred.ai` → set env `SITE_URL=https://thehundred.ai` and `EDITOR_NAME=Your Name`.

## Product

- **Observatory** — map by kind, receipts, gated heat
- **Atlas** — the catalog
- **Rankings** — per-kind editorial prior
- **This week** — dated receipts · [/week](/week)
- **Lens** — disagreement / lineage / displacement (cited boards, never absorbed)
- **JSON** · **RSS** · **sitemap**

Rank is catalog prior, signed. Heat is a mention count and is hidden when core firehoses are dark. Techniques are not matched in arXiv titles.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sai-prakash/aether-atlas&project-name=hundred&repository-name=aether-atlas&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

Env: `STORAGE_URL` or `DATABASE_URL` (Neon). Optional: `SITE_URL`, `EDITOR_NAME`, `GITHUB_TOKEN`, `AA_API_KEY`, `XAI_API_KEY`.

One daily cron (`/api/cron`). Hobby-safe. Visitors never trigger the firehoses.

## Cost

Vercel Hobby + Neon Free + public firehoses = **$0**. Optional Grok brief ≈ **$0.18/mo** if run daily.
