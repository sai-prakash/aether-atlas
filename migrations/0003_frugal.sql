-- Materialized observatory snapshot: one row, all reads.
create table if not exists pulse_state (
  id text primary key,
  payload text not null,
  built_at timestamptz not null default now()
);

create index if not exists snapshots_captured_idx on snapshots (captured_at);
create index if not exists signals_ingested_idx on signals (ingested_at);
create index if not exists ingest_runs_started_idx on ingest_runs (started_at desc);
