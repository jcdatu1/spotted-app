# Design — add-auth-and-profiles

## Context

The scaffold (archived `add-project-scaffold`) gives us a booting Expo SDK 54 app, a typed data layer, and two cloud Supabase projects with zero schema. This change introduces the first migration and the auth layer. Everything downstream (trips, follows, reactions) hangs off `profiles.id`, and the locked project decisions apply: no role column ever, RLS ownership via `auth.uid()`, migrations pushed staging → prod.

## Goals / Non-Goals

**Goals:**
- A user can create an account (claiming a unique username), sign in, sign out, and stay signed in across app restarts.
- Every `auth.users` row automatically has exactly one `profiles` row — no client-side "create profile" step that can be skipped or fail halfway.
- Unauthenticated users see only the auth flow; authenticated users see the tab shell.
- The Profile tab shows and edits the signed-in user's own profile.
- The migration pipeline (write SQL → push staging → generate types → push prod) is exercised end-to-end and documented by doing.

**Non-Goals:**
- Social sign-in, password reset, email confirmation (explicitly disabled for MVP), MFA.
- Avatar upload (requires Storage buckets/policies — comes with a later change; `avatar_url` column exists but stays null).
- Viewing *other* users' profiles as screens (arrives with `add-follows-and-discovery`; the RLS read policy already allows it).
- Account deletion / data export (pre-launch requirement, own change).

## Decisions

### D1: Schema — `profiles` 1:1 with `auth.users`, trigger-provisioned
```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 1 and 50),
  avatar_url text,
  bio text check (char_length(bio) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
A `security definer` trigger on `auth.users` inserts the profile at sign-up, reading `username`/`display_name` from `raw_user_meta_data` (passed via supabase-js `options.data`). *Alternative considered:* client inserts its own profile after sign-up — rejected; a crash between sign-up and insert leaves orphaned users, and the trigger makes "every user has a profile" a database invariant instead of an app promise.

### D2: RLS
- `select`: any **authenticated** user (profiles are public-within-the-app: feeds and trip threads must show creator names). Matches the locked "authenticated-only reads in MVP" visibility decision.
- `update`: `auth.uid() = id`, with a trigger keeping `updated_at` current; `username` is immutable after creation for MVP (no `username` in the update policy's allowed columns via a `with check` comparing it to the existing value).
- `insert`/`delete`: none for clients — the trigger owns insert (security definer), deletion cascades from `auth.users`.

### D3: Auth method — email/password, confirmation off for MVP
Email+password only, matching the designed onboarding screens. Email confirmation is **disabled** in both Supabase projects for MVP: enabling it requires deep-link handling and email templates for near-zero benefit pre-launch. Recorded as a launch-blocker to revisit (alongside password reset). *Alternative considered:* magic-link/OTP — fewer credentials to forget, but requires the same deep-link plumbing now and fights the designed UI.

### D4: Session plumbing in React Native
supabase-js on RN needs `@react-native-async-storage/async-storage` as the auth storage adapter and `react-native-url-polyfill/auto` imported before client creation — both go in `src/data/client.ts` (the only place the client exists). A `SessionProvider` (React context in `src/data/auth.ts`, consumed via `useSession()`) subscribes to `onAuthStateChange` and exposes `session | null | 'loading'`.

### D5: Route protection via expo-router groups
New `(auth)` route group: `welcome`, `sign-in`, `sign-up`. The root layout renders `(auth)` vs `(tabs)` based on `useSession()` — a redirect at the layout level, not per-screen checks, so screens can't be reached unguarded. Splash screen holds until the initial session restore resolves, preventing a sign-in flash for returning users. RLS remains the real enforcement; routing is UX.

### D6: Types and data-layer shape
After the staging push: `npx supabase gen types typescript --linked > src/data/types.ts` replaces the placeholder. `src/data/profiles.ts` exposes `getMyProfile()`, `updateMyProfile(patch)` and TanStack Query hooks (`useMyProfile`, `useUpdateMyProfile` with invalidation). `src/data/auth.ts` exposes `signUp({email, password, username, displayName})`, `signIn`, `signOut`, `useSession`. Screens never touch supabase-js (existing ESLint rule enforces).

### D7: Staging → prod promotion in this change
The migration lands on staging first; prod is pushed at the end of the change once device verification passes. Both projects also need the same dashboard auth settings (email provider on, confirmation off). Doing prod now keeps the environments from drifting while the process is fresh.

## Risks / Trade-offs

- [Username claimed at sign-up can collide → trigger insert fails → user created without profile] → The unique violation aborts the whole sign-up transaction (trigger runs in it), so no orphan is created; surface "username taken" by pre-checking availability in the sign-up form before submitting.
- [Email confirmation off means typo'd emails create unrecoverable accounts] → Accepted for MVP (no password reset either); both ride the same pre-launch auth-hardening change.
- [Immutable usernames may frustrate users] → Deliberate: usernames will appear in shareable URLs later; renaming breaks links. Display name is freely editable.
- [Session restore adds a loading gate at startup] → Held behind the existing splash screen; measured as part of device verification.

## Migration Plan

1. `supabase link` → staging; `supabase db push` (first migration).
2. Verify on device against staging (sign-up → profile row exists; RLS spot-checks).
3. `supabase link` → prod; `supabase db push`; mirror dashboard auth settings.
Rollback: `drop table public.profiles` + drop trigger/function (no dependents yet); disable email provider.

## Open Questions

- None blocking. Avatar upload lands with the Storage-using change (likely `add-trips-and-updates` for photos, or its own change).
