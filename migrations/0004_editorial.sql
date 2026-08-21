-- Editorial map: verification, specs, changelog. Synthetic seed history is not drift.
alter table entities add column if not exists status text not null default 'active';
alter table entities add column if not exists verified_at timestamptz;
alter table entities add column if not exists spec text not null default '{}';

create table if not exists changelog (
  id serial primary key,
  entity_id text not null,
  at date not null,
  title text not null,
  body text not null default '',
  source_url text not null default ''
);

create unique index if not exists changelog_entity_at_title_idx
  on changelog (entity_id, at, title);
create index if not exists changelog_at_idx on changelog (at desc);

-- Fake 14-day score wobble from first boot. Drift starts from live pulses.
truncate snapshots;
