-- add-auth-and-profiles: profiles table, auto-provisioning trigger, RLS.
-- Every auth.users row gets exactly one profiles row (trigger-owned insert);
-- clients can read all profiles (authenticated) and update only their own.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null
    check (char_length(display_name) between 1 and 50),
  avatar_url text,
  bio text check (char_length(bio) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles are readable app-wide (authenticated only, per MVP visibility decision).
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Owners can update their own row. Username immutability is enforced by trigger
-- below (WITH CHECK cannot compare OLD and NEW values).
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No INSERT/DELETE policies: insert is trigger-owned (security definer),
-- delete cascades from auth.users removal.

create or replace function public.prevent_username_change()
returns trigger
language plpgsql
as $$
begin
  if new.username is distinct from old.username then
    raise exception 'username is immutable';
  end if;
  return new;
end;
$$;

create trigger profiles_username_immutable
  before update on public.profiles
  for each row
  execute function public.prevent_username_change();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Auto-provision a profile at sign-up. Runs inside the auth.users insert
-- transaction: a failing insert (e.g. duplicate username) aborts the sign-up,
-- so no orphaned auth user can exist.
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
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Username availability pre-check for the sign-up form. Security definer so the
-- anon role can call it (profiles SELECT is authenticated-only).
create or replace function public.username_available(name text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select not exists (
    select 1 from public.profiles where username = lower(name)
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;
