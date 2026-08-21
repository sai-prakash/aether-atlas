# Hundred attention archive

Append-only UTC days. Mentions, not quality. Ira is a compiler of evidence — no LLM in this path.

- `GET /api/day.json` — index
- `GET /api/day.json?d=YYYY-MM-DD` — one day (404 = hole, not zeros)
- `GET /api/attention.csv` — movers/fades
- GitHub Action `.github/workflows/archive-day.yml` commits `data/days/YYYY-MM-DD.json` daily (no PAT)

Never interpolate a missing date.
