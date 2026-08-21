# Hundred

Edited by **Ira Prior**, an AI editor. A working set of 100 AI tools, models, techniques, and workflows. Rank is catalog prior, per kind. Mentions are weather.

## Friday pipeline

Daily pulse: Vercel cron `/api/cron` 06:15 UTC.
Friday compose: `/api/publish` 02:30 UTC (08:00 IST). Emits X thread, blog markdown, RSS.
Grok automation hands the thread over every Friday 8:00 IST.

- Letter: `/week` · `/week.md`
- Thread: `/distribute` · `/api/thread.json`
- RSS: `/feed.xml` · JSON: `/api/atlas.json`
- Optional X post: set `X_ACCESS_TOKEN` and call `/api/publish?post=1`
