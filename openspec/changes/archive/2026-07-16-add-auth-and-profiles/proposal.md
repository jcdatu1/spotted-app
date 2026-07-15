# add-auth-and-profiles

## Why

The scaffold runs but has no concept of a user — nothing can be created, followed, or saved until identity exists. This change ships the first database migration and the auth foundation every subsequent feature builds on: accounts, sessions, and the profile row that trips and follows will reference. It exercises the full schema pipeline (migration → staging → types → data layer → RLS) for the first time, on the simplest possible table.

## What Changes

- First migration: `profiles` table (1:1 with `auth.users`, auto-provisioned by a database trigger on sign-up) with RLS policies — readable by any authenticated user, writable only by the owner.
- Email/password authentication via Supabase Auth: sign-up (with username claim), sign-in, sign-out, and persistent sessions across app restarts (AsyncStorage-backed).
- Route protection with expo-router: unauthenticated users land in the auth flow (welcome / sign-in / sign-up screens from the Claude Design onboarding); authenticated users land in the tab shell.
- Profile tab becomes real: shows the signed-in user's profile (username, display name) with inline editing and sign-out. No avatar upload yet (needs Storage — deferred).
- `src/data/types.ts` placeholder replaced with generated types (`supabase gen types`); new `src/data/auth.ts` and `src/data/profiles.ts` data-layer modules.
- Migration applied to `spotted-staging`, then promoted to `spotted-prod`.

Out of scope: social auth providers, password reset flow, email confirmation (disabled for MVP — revisit before launch), avatar upload, account deletion, trips/any content tables.

## Capabilities

### New Capabilities

- `user-auth`: Account creation, sign-in/sign-out, session persistence, and route protection — who can enter the app and how the app knows who they are.
- `user-profiles`: The profile record backing every user — auto-provisioning on sign-up, username rules, RLS ownership, and viewing/editing one's own profile.

### Modified Capabilities

- `project-scaffold`: The app-launch requirement changes — the app now launches to the auth flow when no session exists, and to the tab shell when one does (previously it always launched to the tab shell).

## Impact

- **Code**: New `supabase/migrations/` (first migration), `src/data/auth.ts`, `src/data/profiles.ts`, regenerated `src/data/types.ts`, session provider in the root layout, new `src/app/(auth)/` route group, real Profile tab screen in `src/features/profile/`.
- **Dependencies**: `@react-native-async-storage/async-storage` (session storage), `react-native-url-polyfill` (supabase-js on React Native).
- **Systems**: `spotted-staging` and `spotted-prod` receive the migration and auth configuration (email provider enabled, email confirmation disabled for MVP); Supabase CLI gets linked with a personal access token.
- **Follow-on**: Unblocks `add-trips-and-updates` (trips reference `profiles.id` as owner).
