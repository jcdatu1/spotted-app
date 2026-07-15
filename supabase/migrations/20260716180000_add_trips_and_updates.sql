-- add-trips-and-updates: trips + typed updates (ONE table, per-type CHECKs),
-- per-currency budget view, RLS (published-or-owner), private trip-media bucket.

create type public.trip_status as enum ('draft', 'published');
create type public.update_type as enum ('note', 'photo', 'video', 'purchase', 'attraction');
-- 'video' is reserved for a later change; no UI offers it yet.

-- ---------------------------------------------------------------- trips

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) <= 280),
  status public.trip_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_owner_idx on public.trips (owner_id);
create index trips_published_idx on public.trips (status, published_at desc);

create trigger trips_set_updated_at
  before update on public.trips
  for each row
  execute function public.set_updated_at();

alter table public.trips enable row level security;

-- Trip visibility is defined HERE and only here; updates/budgets delegate to it.
create policy "trips_select_visible"
  on public.trips for select
  to authenticated
  using (status = 'published' or owner_id = (select auth.uid()));

create policy "trips_insert_own"
  on public.trips for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "trips_update_own"
  on public.trips for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "trips_delete_own"
  on public.trips for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------- updates

create table public.updates (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  type public.update_type not null,
  happened_at timestamptz not null default now(), -- drives thread order; creator-editable later
  created_at timestamptz not null default now(),
  body text check (char_length(body) <= 1000), -- note text / caption
  place_name text check (char_length(place_name) <= 120),
  vendor_name text check (char_length(vendor_name) <= 120),
  amount numeric(12, 2) check (amount >= 0),
  currency char(3) check (currency ~ '^[A-Z]{3}$'),
  media_path text,
  constraint note_requires_body
    check (type <> 'note' or body is not null),
  constraint photo_requires_media
    check (type <> 'photo' or media_path is not null),
  constraint purchase_requires_fields
    check (type <> 'purchase' or (amount is not null and currency is not null and vendor_name is not null)),
  constraint attraction_requires_place
    check (type <> 'attraction' or place_name is not null), -- entry fee optional (free attractions)
  constraint amount_requires_currency
    check (amount is null or currency is not null)
);

create index updates_thread_idx on public.updates (trip_id, happened_at);

alter table public.updates enable row level security;

create policy "updates_select_via_trip"
  on public.updates for select
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id
        and (t.status = 'published' or t.owner_id = (select auth.uid()))
    )
  );

create policy "updates_insert_trip_owner"
  on public.updates for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = (select auth.uid())
    )
  );

create policy "updates_update_trip_owner"
  on public.updates for update
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = (select auth.uid())
    )
  )
  with check (author_id = (select auth.uid()));

create policy "updates_delete_trip_owner"
  on public.updates for delete
  to authenticated
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.owner_id = (select auth.uid())
    )
  );

-- ------------------------------------------------------- budget rollup view

-- security_invoker: the caller's RLS on updates applies, so budgets of
-- invisible (draft) trips return zero rows.
create view public.trip_budgets
  with (security_invoker = true)
as
  select
    trip_id,
    currency,
    sum(amount)::numeric(14, 2) as total,
    count(*)::int as items
  from public.updates
  where type in ('purchase', 'attraction') and amount is not null
  group by trip_id, currency;

-- ------------------------------------------------------------ storage bucket

insert into storage.buckets (id, name, public)
values ('trip-media', 'trip-media', false);

-- Uploads/deletes only inside the caller's own top-level folder: {uid}/...
create policy "trip_media_insert_own_prefix"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trip-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "trip_media_delete_own_prefix"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trip-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "trip_media_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'trip-media');
