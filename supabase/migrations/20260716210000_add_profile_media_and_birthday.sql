-- add-profile-media-and-storage: profile media columns (paths, not URLs),
-- owner-private birthday table, public profile-media bucket.

-- ------------------------------------------------------------ profile media columns

-- avatar_url was never written; rename to match the media_path convention.
alter table public.profiles rename column avatar_url to avatar_path;
alter table public.profiles add column cover_path text;

-- ------------------------------------------------------------ private_profiles

-- Birthday lives off the app-readable profiles table: RLS is row-level, so
-- owner-only visibility requires its own table, not a column.
create table public.private_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  birthday date
    check (
      birthday >= date '1900-01-01'
      and birthday <= (current_date - interval '13 years')::date
    )
);

alter table public.private_profiles enable row level security;

create policy "private_profiles_select_own"
  on public.private_profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "private_profiles_update_own"
  on public.private_profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No INSERT/DELETE policies: insert is trigger-owned (below), delete cascades
-- from profiles removal — same shape as profiles itself.

-- Provision the private row alongside the profile at sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(coalesce(new.raw_user_meta_data ->> 'username', '')),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Traveler')
  );
  insert into public.private_profiles (id) values (new.id);
  return new;
end;
$$;

-- Backfill accounts created before this migration.
insert into public.private_profiles (id)
select id from public.profiles
on conflict (id) do nothing;

-- ------------------------------------------------------------ storage bucket

-- Public: avatars/covers render everywhere and profiles are app-readable by
-- design — stable URLs beat per-hour signed-URL churn. Unguessable unique
-- filenames; writes/deletes stay locked to the caller's own prefix.
insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', true);

create policy "profile_media_insert_own_prefix"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "profile_media_delete_own_prefix"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "profile_media_select_authenticated"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-media');
