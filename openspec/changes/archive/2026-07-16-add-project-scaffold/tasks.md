# Tasks — add-project-scaffold

## 1. Repo & App Bootstrap

- [x] 1.1 Decide package manager (default: npm) and initialize the Expo + TypeScript app (`create-expo-app` with the expo-router template) at repo root
- [x] 1.2 Enable TypeScript strict mode and verify the default app boots on a device/simulator via `npx expo start`
- [x] 1.3 Add `.gitignore`, `.env.example` (Supabase URL/anon key, `EXPO_PUBLIC_SENTRY_ENABLED=false`, `EXPO_PUBLIC_POSTHOG_ENABLED=false`), and env loading

## 2. Styling & Design Tokens

- [x] 2.1 Install and configure NativeWind + Tailwind (babel/metro config), pinning versions compatible with the installed Expo SDK
- [x] 2.2 Create `src/theme/tokens.ts` with colors, type scale, and spacing from the Claude Design file (placeholders where values are not yet exported)
- [x] 2.3 Wire `tailwind.config.js` theme to import from `src/theme/tokens.ts` and verify a token change propagates to a rendered class

## 3. Navigation Shell

- [x] 3.1 Create root layout `app/_layout.tsx` with providers (QueryClientProvider, theme) and tab layout `app/(tabs)/_layout.tsx` styled from tokens
- [x] 3.2 Add placeholder screens Home (`(tabs)/index.tsx`), Saved (`(tabs)/saved.tsx`), Profile (`(tabs)/profile.tsx`) using token-backed NativeWind classes and accessible labels
- [x] 3.3 Verify tab navigation works on device/simulator with the themed tab bar _(verified on device via Expo Go, 2026-07-16)_

## 4. Supabase Local Dev & Typed Data Layer

- [x] 4.1 Install Supabase CLI config: run `supabase init` (config.toml committed, `supabase/migrations` left empty) and document `supabase start`
- [x] 4.2 Create `src/data/client.ts` — single Supabase client from env vars with fail-fast error when required vars are missing
- [x] 4.3 Create `src/data/health.ts` — `checkBackendHealth(): Promise<{ ok, latencyMs }>` hitting the local PostgREST/auth health endpoint, plus a `useHealthCheck` TanStack Query hook
- [x] 4.4 Render health-check status (connected + latency / explicit disconnected state) on the Home placeholder; verify both states _(both states observed on device against staging, 2026-07-16)_
- [x] 4.5 Add `src/data/types.ts` placeholder and `src/features/` directory with a README note on feature organization; add an ESLint rule (`no-restricted-imports`) blocking `@supabase/supabase-js` outside `src/data/`

## 5. Observability Stubs

- [x] 5.1 Install Sentry (Expo-compatible SDK) and initialize only when `EXPO_PUBLIC_SENTRY_ENABLED=true`
- [x] 5.2 Install PostHog React Native SDK and initialize only when `EXPO_PUBLIC_POSTHOG_ENABLED=true`
- [x] 5.3 Verify the app runs cleanly with both flags false and no keys configured

## 6. Quality Gates & Docs

- [x] 6.1 Configure ESLint (expo + react-hooks + import ordering) and Prettier; add `typecheck`, `lint`, `format`, `format:check` scripts
- [x] 6.2 Run all gates on the finished scaffold and fix violations until all exit 0
- [x] 6.3 Write README: prerequisites (Node, Docker Desktop, Supabase CLI), exact clone-to-running command sequence, env setup, and troubleshooting note for local Supabase
- [x] 6.4 Fresh-clone dry run: follow the README verbatim and confirm tab shell + passing health check with no undocumented steps _(README sequence exercised end-to-end via Expo Go + staging, 2026-07-16)_
