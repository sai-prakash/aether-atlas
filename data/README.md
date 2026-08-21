# Hundred attention archive

Append-only UTC days. Mentions, not quality. Ira is a compiler of evidence — no LLM in this path.

- `GET /api/day.json` — index
- `GET /api/day.json?d=YYYY-MM-DD` — one day (404 = hole, not zeros)
- `GET /api/attention.csv` — movers/fades

If `ARCHIVE_GITHUB_TOKEN` + `ARCHIVE_REPO` are set, each pulse also commits `data/days/YYYY-MM-DD.json`.

Never interpolate a missing date.
