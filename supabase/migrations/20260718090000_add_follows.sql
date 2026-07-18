-- add-follows: the follow relationship — a bare owned edge table. First
-- migration of the social graph.

-- ------------------------------------------------------------ follows

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- Follower counts and follower lists query by followee; the PK already
-- covers follower-side lookups.
create index follows_followee_id_idx on public.follows (followee_id);

alter table public.follows enable row level security;

-- Counts and is-following checks are public-within-app, matching profiles
-- readability. Edges are created/deleted only by their owner and never
-- mutated — no UPDATE policy.
create policy "follows_select_authenticated"
  on public.follows for select
  to authenticated
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check ((select auth.uid()) = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using ((select auth.uid()) = follower_id);
