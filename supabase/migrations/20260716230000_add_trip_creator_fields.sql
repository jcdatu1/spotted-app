-- add-trip-creator: countries, from/to date range, cover photo on trips, and
-- the publish date gate. Live/Completed are DERIVED at read time from
-- status + dates — never stored, no scheduled transitions.

alter table public.trips
  add column start_date date,
  add column end_date date,
  add column country_codes text[] not null default '{}',
  add column cover_path text;

alter table public.trips
  add constraint trips_country_codes_max
    check (cardinality(country_codes) <= 20);

-- Existing published rows predate dates; backfill so the publish CHECKs
-- below validate against them.
update public.trips
set start_date = (published_at at time zone 'utc')::date,
    end_date = (published_at at time zone 'utc')::date
where status = 'published' and start_date is null;

alter table public.trips
  add constraint trips_dates_paired
    check ((start_date is null) = (end_date is null)),
  add constraint trips_dates_ordered
    check (start_date is null or start_date <= end_date),
  add constraint trips_publish_requires_dates
    check (status <> 'published' or start_date is not null),
  -- Write-time gate: no publishing before the trip starts. current_date is
  -- the server's UTC date while the client gates in device-local time, so
  -- "+ 1" keeps a legitimate local-today publish (up to UTC+14) from being
  -- rejected; the client UX is the real gate.
  add constraint trips_publish_not_before_start
    check (status <> 'published' or start_date <= current_date + 1);
