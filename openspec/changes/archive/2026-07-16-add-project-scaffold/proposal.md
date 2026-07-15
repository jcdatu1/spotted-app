# add-project-scaffold

## Why

Spotted has finished designs (Claude Design) but no repository scaffold, data layer, or backend wiring — nothing can be built or demoed until the toolchain exists. This change derisks the entire stack integration (Expo + TypeScript + expo-router + NativeWind + Supabase local dev) in one falsifiable slice, so every subsequent feature change starts from a booting, verifiable app instead of fighting setup.

## What Changes

- Initialize the Expo (React Native) + TypeScript app with `expo-router` file-based navigation and NativeWind (Tailwind) styling, verified rendering on device/simulator.
- Encode the Claude Design theme tokens (colors, type scale, spacing) as the Tailwind/NativeWind theme — the design system's single entry point into the codebase.
- Add a tab-bar navigation shell with three placeholder screens: Home, Saved, Profile. No real behavior.
- Set up the Supabase CLI project config, a configured Supabase client, and the `src/data/` typed data-layer skeleton with a health-check query that round-trips to the staging Supabase project (cloud staging + prod environments; no local Docker stack). No tables, no migrations.
- Add lint, format, and typecheck scripts that pass clean.
- Initialize Sentry and PostHog behind environment flags (disabled by default in dev).
- Write README run instructions: clone → documented command sequence → app running against local Supabase.

Out of scope (explicitly): database migrations, auth, any real screen behavior, EAS/CI, video (Mux), maps (Mapbox), push notifications.

## Capabilities

### New Capabilities

- `project-scaffold`: Developer-facing capability covering the runnable app shell — bootable Expo app with themed tab navigation, styled via design tokens, a typed data-layer skeleton that verifies connectivity to local Supabase, passing quality gates (typecheck/lint/format), and documented setup steps.

### Modified Capabilities

_None — this is the first change in an empty repo._

## Impact

- **Code**: New repo scaffold — `app/` (expo-router routes), `src/data/` (typed data layer), `src/theme` (design tokens via Tailwind config), `supabase/` (CLI config only, no migrations), root configs (tsconfig, eslint, prettier, tailwind, babel/metro).
- **Dependencies**: expo, expo-router, nativewind/tailwindcss, @supabase/supabase-js, @tanstack/react-query, zustand, @sentry/react-native, posthog-react-native, dev tooling (typescript, eslint, prettier).
- **Systems**: Two cloud Supabase projects (`spotted-staging`, `spotted-prod`) created in the dashboard; development and Expo Go target staging. No schema is provisioned by this change.
- **Follow-on**: Unblocks `add-auth-and-profiles` (first migration + auth flows) and every later change in the planned sequence.
