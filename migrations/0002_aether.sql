create table if not exists entities (
  id text primary key,
  kind text not null,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  license text not null default 'commercial',
  vendor text not null default '',
  website text not null default '',
  github text not null default '',
  paper_url text not null default '',
  categories text not null default '[]',
  techniques text not null default '[]',
  features text not null default '[]',
  pricing text not null default '',
  catalog_weight real not null default 50,
  aliases text not null default '[]',
  score real not null default 0,
  momentum real not null default 0,
  mentions_24h int not null default 0,
  mentions_7d int not null default 0,
  github_stars int not null default 0,
  hf_downloads int not null default 0,
  last_seen timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists entities_kind_idx on entities (kind);
create index if not exists entities_score_idx on entities (score desc);
create index if not exists entities_momentum_idx on entities (momentum desc);

create table if not exists snapshots (
  id serial primary key,
  entity_id text not null,
  captured_at timestamptz not null default now(),
  score real not null,
  mentions int not null default 0,
  rank int not null default 0,
  github_stars int not null default 0
);

create index if not exists snapshots_entity_time_idx on snapshots (entity_id, captured_at);

create table if not exists signals (
  id serial primary key,
  source text not null,
  title text not null,
  url text not null,
  snippet text not null default '',
  entity_id text not null default '',
  score int not null default 0,
  published_at timestamptz,
  ingested_at timestamptz not null default now()
);

create unique index if not exists signals_url_idx on signals (url);
create index if not exists signals_published_idx on signals (published_at desc);
create index if not exists signals_entity_idx on signals (entity_id);

create table if not exists insights (
  id serial primary key,
  period text not null,
  title text not null,
  body text not null,
  generated_at timestamptz not null default now()
);

create table if not exists ingest_runs (
  id serial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  sources text not null default '[]',
  stats text not null default '{}'
);
