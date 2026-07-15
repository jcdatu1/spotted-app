# project-scaffold Specification

## Purpose

The runnable foundation of the Spotted app: a bootable Expo application with themed tab navigation driven by design tokens, a typed data layer as the sole Supabase access path, verified connectivity to the configured Supabase environment, passing quality gates, and documented setup. Ships no database schema — the scaffold ends where the first migration begins.

## Requirements

### Requirement: App boots with themed tab navigation
The Expo app SHALL build and run on an iOS simulator, Android emulator, or physical device via Expo Go. When a session exists it SHALL present a tab bar with Home, Saved, and Profile screens styled with NativeWind classes; when no session exists it SHALL present the auth flow instead.

#### Scenario: App launches to tab shell
- **WHEN** a developer runs `npx expo start` and opens the app on a device or simulator with an active session
- **THEN** the app renders the Home screen inside a themed tab bar without runtime errors

#### Scenario: App launches to auth flow
- **WHEN** the app is opened with no active session
- **THEN** the app renders the welcome/auth flow without runtime errors

#### Scenario: Tabs navigate
- **WHEN** the user taps the Saved or Profile tab
- **THEN** the corresponding screen is displayed and the active tab indicator updates

### Requirement: Design tokens are the single styling source of truth
The project SHALL define the Claude Design tokens (colors, type scale, spacing) in `src/theme/tokens.ts`, and the Tailwind/NativeWind configuration SHALL derive its theme from that module. Components MUST NOT hardcode color, font-size, or spacing values that exist as tokens.

#### Scenario: Tailwind theme derives from tokens
- **WHEN** a token value is changed in `src/theme/tokens.ts`
- **THEN** NativeWind utility classes reflect the new value after rebuild, with no other file requiring edits

#### Scenario: Placeholder screens use token-based classes
- **WHEN** the placeholder screens are inspected
- **THEN** their styling uses NativeWind classes backed by the token theme, not inline literal values

### Requirement: Typed data layer is the only Supabase access path
The project SHALL provide a `src/data/` module that initializes the Supabase client from environment variables and exposes typed functions/hooks. Application code outside `src/data/` MUST NOT import `@supabase/supabase-js` directly.

#### Scenario: Client initializes from environment
- **WHEN** the app starts with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` set
- **THEN** the Supabase client is created once in `src/data/client.ts` and importable by data-layer modules

#### Scenario: Missing environment variables fail fast
- **WHEN** the app starts without the required Supabase environment variables
- **THEN** the app surfaces a clear configuration error instead of failing on the first query

### Requirement: Backend health check round-trips to the configured Supabase environment
The data layer SHALL expose a health-check function returning `{ ok, latencyMs }` that verifies connectivity to the Supabase project configured in the environment (staging by default for development), and the Home placeholder SHALL display its result via a TanStack Query hook.

#### Scenario: Staging project reachable
- **WHEN** `.env` holds valid staging credentials and the Home screen is opened
- **THEN** the health check reports `ok: true` and the screen shows a connected state with latency

#### Scenario: Backend unreachable
- **WHEN** the configured Supabase project cannot be reached (bad credentials, paused project, no network) and the Home screen is opened
- **THEN** the health check reports `ok: false` and the screen shows an explicit disconnected state, not a crash or silent success

### Requirement: No database schema is introduced
This change SHALL NOT create any database migration, table, or RLS policy; the `supabase/migrations` directory MUST be empty at completion.

#### Scenario: Migrations directory empty
- **WHEN** the change is complete and `supabase/migrations` is listed
- **THEN** it contains no migration files

### Requirement: Quality gates pass clean
The project SHALL provide `typecheck`, `lint`, `format`, and `format:check` scripts, with TypeScript in strict mode, and all gates SHALL pass on the completed scaffold.

#### Scenario: Gates pass on fresh clone
- **WHEN** a developer runs the install step followed by `typecheck`, `lint`, and `format:check`
- **THEN** all three commands exit with code 0

### Requirement: Observability SDKs are initialized behind flags
Sentry and PostHog SHALL be initialized only when their respective `EXPO_PUBLIC_*_ENABLED` flags are true, and the app SHALL run normally in development with both flags false and no DSN/API keys configured.

#### Scenario: Flags off in development
- **WHEN** the app runs with `EXPO_PUBLIC_SENTRY_ENABLED=false` and `EXPO_PUBLIC_POSTHOG_ENABLED=false`
- **THEN** neither SDK sends network traffic and no missing-key errors occur

### Requirement: Documented setup from clone to running app
The README SHALL document prerequisites (Node, Expo Go, staging project access), the staging/production environment model, and an exact command sequence that takes a new developer from clone to the app running against the staging Supabase project.

#### Scenario: New developer follows README
- **WHEN** a developer with the prerequisites follows the README steps on a fresh clone
- **THEN** they reach the tab shell with a passing health check without steps outside the README
