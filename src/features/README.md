# Feature modules

Components are organized by feature, not by kind. Each feature gets a folder
here (e.g. `trip-thread/`, `composer/`, `discovery/`) containing its screens'
building blocks, hooks, and local state (Zustand) — anything reusable across
features graduates to a shared location only when a second feature needs it.

Rules:

- Server state lives in TanStack Query hooks that call functions from
  `src/data/` — never import `@supabase/supabase-js` here (ESLint enforces it).
- Style with NativeWind classes backed by `src/theme/tokens.ts`; no hardcoded
  colors, font sizes, or spacing.
- Route files in `src/app/` stay thin — they compose feature components.
