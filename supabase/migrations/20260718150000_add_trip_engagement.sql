-- rework-trip-cards-and-engagement: views and saves — per-user edge rows on
-- published trips, plus a counting view. Owners never count themselves;
-- drafts accrue nothing (both DB-enforced, not just client courtesy).

-- ------------------------------------------------------------ trip_views

create table public.trip_views (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

alter table public.trip_views enable row level security;

-- Counts are public-within-app, matching follows readability.
create policy "trip_views_select_authenticated"
  on public.trip_views for select
  to authenticated
  using (true);

-- A view is "this user has opened this published trip" — one row per pair,
-- inserted by the viewer, never on own or draft trips. No UPDATE/DELETE:
-- a view, once counted, is immutable.
create policy "trip_views_insert_own_published_not_owner"
  on public.trip_views for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.trips t
      where t.id = trip_id
        and t.status = 'published'
        and t.owner_id <> (select auth.uid())
    )
  );

-- ------------------------------------------------------------ trip_saves

create table public.trip_saves (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- A future passport/saved-list surface queries by saver; the PK covers
-- per-trip counting.
create index trip_saves_user_id_idx on public.trip_saves (user_id);

alter table public.trip_saves enable row level security;

create policy "trip_saves_select_authenticated"
  on public.trip_saves for select
  to authenticated
  using (true);

create policy "trip_saves_insert_own_published_not_owner"
  on public.trip_saves for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.trips t
      where t.id = trip_id
        and t.status = 'published'
        and t.owner_id <> (select auth.uid())
    )
  );

-- Unsave: delete your own row only.
create policy "trip_saves_delete_own"
  on public.trip_saves for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------ trip_engagement

-- Per-trip counts. security_invoker keeps trip visibility flowing from trip
-- RLS (locked decision: visibility logic centralized there) — you only get
-- engagement rows for trips you could read anyway.
create view public.trip_engagement
with (security_invoker = true) as
select
  t.id as trip_id,
  (select count(*) from public.trip_views v where v.trip_id = t.id) as view_count,
  (select count(*) from public.trip_saves s where s.trip_id = t.id) as save_count
from public.trips t;
