# Spotted

A mobile social travel app. Creators publish travel journals as chat-style threads of typed updates (notes, photos, purchases, attractions — video later); readers walk the journey update-by-update, save stops, and copy itineraries with auto-rolled budgets.

Built with Expo (React Native) + TypeScript, expo-router, NativeWind, TanStack Query, Zustand, and Supabase. Work is planned and tracked as OpenSpec changes in [openspec/](openspec/).

## Environments

| Environment | Supabase project | Who uses it |
| ----------- | ----------------- | ------------------------------------------------ |
| development | `spotted-staging` | Expo Go / dev builds — everything in `.env`      |
| production  | `spotted-prod`    | Release builds only (env injected via EAS later) |

There is no local database stack: development talks directly to the **staging** cloud project. Schema changes are written as migrations in `supabase/migrations/` and pushed with the Supabase CLI to staging first, then prod (starting with the `add-auth-and-profiles` change — the scaffold ships no schema).

The production anon key and URL never live in this repo; they are injected per build profile when EAS builds arrive.

## Prerequisites

- **Node.js** ≥ 20 (with npm)
- A phone with **Expo Go** ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)), or an iOS simulator / Android emulator
- Access to the `spotted-staging` Supabase project (dashboard → Project Settings → API)

## Getting started

```sh
git clone <repo-url> spotted_app
cd spotted_app
npm install

# Configure the app environment: copy .env.example to .env, then paste the
# staging project's URL and anon key from the Supabase dashboard.
# (Windows PowerShell: Copy-Item .env.example .env)
cp .env.example .env

# Run the app
npx expo start
```

Scan the QR code with Expo Go (or press `i` / `a` for a simulator). You should see the Spotted tab shell; the Home screen shows **Backend connected** with a latency reading when staging is reachable.

## Scripts

| Command                | What it does                    |
| ---------------------- | ------------------------------- |
| `npm start`            | Start the Expo dev server       |
| `npm run typecheck`    | TypeScript strict type-checking |
| `npm run lint`         | ESLint (`expo lint`)            |
| `npm run format`       | Prettier write                  |
| `npm run format:check` | Prettier verify                 |

## Project layout

```
src/app/        expo-router routes (thin — compose feature components only)
src/features/   feature-organized components, hooks, local state
src/data/       typed data layer — the ONLY place Supabase is accessed
src/theme/      design tokens (single source of truth; feeds tailwind.config.js)
src/lib/        cross-cutting utilities (observability, …)
supabase/       Supabase CLI config + migrations (empty until add-auth-and-profiles)
openspec/       specs and change proposals (OpenSpec)
context/        Claude Design prototype the design tokens were extracted from
```

Conventions: no ad-hoc Supabase queries in components (ESLint-enforced), styling via NativeWind classes backed by `src/theme/tokens.ts`, permissions via RLS once schema lands.

## Migrations (from add-auth-and-profiles onward)

```sh
npx supabase login                                  # once, with a personal access token
npx supabase link --project-ref <staging-ref>      # once per machine
npx supabase db push                                # apply pending migrations to staging
# verify on staging, then:
npx supabase link --project-ref <prod-ref>
npx supabase db push                                # promote to prod
```

No Docker required — `db push` runs against the cloud projects. Regenerate types after schema changes: `npx supabase gen types typescript --linked > src/data/types.ts`.

## Troubleshooting

- **Home screen shows "Backend unreachable"** → check the values in `.env` against the staging dashboard, then restart `npx expo start` (env vars are inlined at bundle time). On the free tier, a paused staging project resumes from the dashboard.
- **Changed `.env` but nothing happened** → stop and restart the dev server with `npx expo start -c` to clear the cache.
- **Sentry/PostHog** stay disabled (`EXPO_PUBLIC_*_ENABLED=false`) unless you provide keys — no keys are needed for development.
