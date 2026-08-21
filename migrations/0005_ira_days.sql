-- Append-only attention days. Never interpolate a missing date.
create table if not exists ira_days (
  day date primary key,
  payload jsonb not null,
  cores int not null default 0,
  gap boolean not null default false,
  letter text,
  built_at timestamptz not null default now()
);

create index if not exists ira_days_built_idx on ira_days (built_at desc);
