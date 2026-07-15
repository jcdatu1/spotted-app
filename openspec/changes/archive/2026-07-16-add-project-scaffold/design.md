# Design — add-project-scaffold

## Context

The repo is empty (git only). Designs exist in Claude Design; the stack is decided (Expo + TypeScript + expo-router + NativeWind, TanStack Query + Zustand, Supabase). This change builds the smallest scaffold that proves the whole toolchain works together on a real device, so feature changes never fight setup. The seam is deliberate: **the scaffold ends where the first migration begins** — no tables, no auth, no behavior.

## Goals / Non-Goals

**Goals:**
- App boots on device/simulator with themed tab navigation (Home / Saved / Profile placeholders).
- Claude Design tokens (colors, type scale, spacing) encoded once as the Tailwind/NativeWind theme.
- App round-trips a health-check query to the staging Supabase project through a typed `src/data/` layer.
- Quality gates (`typecheck`, `lint`, `format:check`) pass clean and are documented.
- README gets a new developer from clone to running app with one documented command sequence.

**Non-Goals:**
- Database migrations, RLS policies, or any table (that starts in `add-auth-and-profiles`).
- Auth, real screen behavior, data fetching beyond the health check.
- EAS builds / CI, Mux, Mapbox, push notifications, Realtime.
- Pixel-perfect screen implementations — placeholders only; real screens arrive with their feature changes.

## Decisions

### D1: Expo managed workflow, Expo Go-compatible
Stay Expo Go-compatible (no custom native modules) until `add-video-updates` / `add-map-view` force a dev client. Pinned to **Expo SDK 54** (not latest 57): the Expo Go build available on the team's test device supports SDK 54, and Expo Go can only run one SDK version. Upgrade the SDK when moving to dev-client builds, where the constraint disappears. Sentry and PostHog are used via their Expo-compatible SDKs with init gated behind env flags so dev runs don't need DSNs/keys. *Alternative considered:* prebuild/dev-client from day one — rejected; it slows iteration now and buys nothing until native modules arrive.

### D2: Directory layout
(Implementation note: the Expo SDK 57 template places routes at `src/app/` rather than a root
`app/` — kept, since it puts everything under `src/` consistent with our conventions.)
```
src/app/                   # expo-router routes only (thin — no logic)
  _layout.tsx              # root: providers (QueryClient, theme)
  (tabs)/_layout.tsx       # tab bar: Home / Saved / Profile
  (tabs)/index.tsx         # Home placeholder
  (tabs)/saved.tsx         # Saved placeholder
  (tabs)/profile.tsx       # Profile placeholder
src/
  data/                    # typed data layer — the ONLY place supabase-js is called
    client.ts              # Supabase client init (env-driven)
    health.ts              # health-check query + useHealthCheck hook
    types.ts               # placeholder for `supabase gen types` output (next change)
  features/                # feature-organized components (empty scaffold + README note)
  theme/                   # design tokens (source of truth consumed by tailwind.config)
supabase/                  # supabase init output; config.toml only, migrations/ empty
```
Routes stay thin; anything reusable lives under `src/`. *Alternative considered:* screens under `src/screens` re-exported by routes — deferred; adopt only if route files grow logic.

### D3: Design tokens as a TypeScript module feeding Tailwind config
Tokens live in `src/theme/tokens.ts` (plain object: colors, spacing, font sizes from Claude Design) and are imported by `tailwind.config.js`. One source of truth usable both by NativeWind classes and by rare imperative styles (e.g., tab bar tint). *Alternative considered:* tokens only in tailwind config — rejected; imperative consumers would re-hardcode values.

### D4: Health check without tables
No tables exist yet, so the health check hits GoTrue's `/auth/v1/health` endpoint with the anon key and requires HTTP 200 (implemented; simpler than the PostgREST-root variant originally sketched). Exposed as `checkBackendHealth(): Promise<{ ok: boolean; latencyMs: number }>` in `src/data/health.ts`, rendered on the Home placeholder via TanStack Query. This proves env wiring, client init, and local stack — the actual goal — without smuggling in a migration.

### D5: Env handling — cloud staging + prod, no local stack
Two cloud Supabase projects: `spotted-staging` (development, Expo Go, migration rehearsal) and `spotted-prod` (releases only). `.env.example` checked in with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_ENABLED=false`, `EXPO_PUBLIC_POSTHOG_ENABLED=false` (+ optional DSN/key vars); `.env` (gitignored) carries staging values. Prod credentials never enter the repo — injected per EAS build profile later. Fail fast with a clear error screen if required vars are missing. *Superseded decision:* the original plan used `supabase start` (Docker) for a local stack; dropped in favor of cloud-only after deciding all testing runs through Expo Go, where a local stack is awkward to reach (LAN IP/firewall) and Docker adds a prerequisite with no payoff until heavy schema iteration. The Supabase CLI (`supabase init` output, `db push`, `gen types --linked`) is retained for cloud migrations — none of it needs Docker.

### D6: Quality gates
`typescript` strict mode; `eslint` (expo config + react-hooks + import ordering); `prettier`. Scripts: `typecheck`, `lint`, `format`, `format:check`. No test runner yet — first meaningful unit tests arrive with the data layer's real queries; adding Jest now would be scaffold theater. *Alternative considered:* Jest + a smoke test now — rejected as low-signal; revisit in `add-trips-and-updates`.

## Risks / Trade-offs

- [NativeWind + Expo SDK version incompatibilities are a known friction point] → Pin exact versions of expo, nativewind, tailwindcss known to work together; verify styled rendering on device as part of acceptance, not just web.
- [Development shares the staging database — a bad dev session can dirty staging data] → Acceptable pre-launch; staging is disposable and re-seedable from the dashboard. Revisit (local stack or per-dev branches) if it starts to hurt.
- [Free-tier Supabase projects pause after ~1 week of inactivity] → Staging resumes with a dashboard click; upgrade prod to Pro before real users.
- [Health check without tables is unconventional] → Accepted deliberately to keep the migration seam clean; replaced by real queries in the next change.
- [Sentry/PostHog added now but unused] → Behind env flags, zero-config in dev; cost is two dependencies, benefit is ops wiring never blocks a feature change later.

## Migration Plan

Greenfield — nothing to migrate. Rollback = delete scaffold. Deploys: none (no cloud resources provisioned).

## Open Questions

- Exact token values must be exported from the Claude Design file before D3 lands (blocking only for the theme task; placeholders acceptable interim).
- Package manager: assume `npm` unless the team prefers `pnpm`/`bun` — decide at task 1; affects README + lockfile only.
