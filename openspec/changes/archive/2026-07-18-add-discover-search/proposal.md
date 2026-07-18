# add-discover-search

## Why

The Discover tab is still a placeholder. The first real slice is search: a way to find creators, trips, and countries by typing — the entry point every later discovery feature (follows, trending, curation) hangs off. Today there is no search surface, no way to view another user's profile, and no path from a name to their trips.

## What Changes

- **Discover search screen**: a search input at the top of Discover with debounced live search-as-you-type (the results are the predictions). Results render in three sections:
  - **Countries** — matched client-side from the static country list (instant), shown as flag + name rows; tapping one shows published trips that include that country.
  - **Users** — profiles matched on username/display name via ILIKE, rendered as avatar thumbnail (public `profile-media` URL) + display name + `@username`; tapping opens their profile.
  - **Trips** — published trips matched on title/description via ILIKE, rendered as the existing boarding-pass TripCards; tapping opens the thread.
- **Recent searches**: stored locally (device-only), shown when the input is empty, tappable to re-run, clearable. This is the "recommendation" layer until real usage data exists.
- **Audience profile screen** (`/user/[id]`, pushed, chevron back): read-only view of another user's profile — cover/avatar/identity header (reusing `ProfileHeader`; its action slot stays empty until follows ship), stats row, and their **published** trips only. No edit, no drafts, no sign-out.
- **Data layer**: `src/data/search.ts` (parallel ILIKE queries, RLS-safe by construction — only published trips are readable) plus small additions to profiles/trips modules (get profile by id, published trips by owner, published trips by country). No migration; the hook shape is designed so a ranked `search_all` RPC or pg_trgm can swap in later without UI changes.

Out of scope: follows (the header action slot stays empty), update-body search, trending/recommended terms (needs usage data), fuzzy matching / ranking beyond simple match ordering, server-side search history.

## Capabilities

### New Capabilities

- `discovery`: the Discover search surface — input behavior, three result sections, country drill-down, recent searches.

### Modified Capabilities

- `user-profiles`: adds the read-only audience profile view (`/user/[id]`) — the tap destination for user search results.

## Impact

- **Code**: `src/app/(tabs)/discover.tsx` (rebuilt as the search screen), new `src/app/user/[id].tsx` route + `Stack.Screen` registration in the root layout, new `src/features/discover/` components, new `src/data/search.ts`, additions to `src/data/profiles.ts` and `src/data/trips.ts`, `SPOTTED_BIBLE.md`.
- **Dependencies/Systems**: none new; no migration (client queries under existing RLS).
- **Follow-on**: `add-follows-and-discovery` fills the audience profile's action slot with Follow and layers trending/recommendations onto Discover; search backend upgradeable to RPC/pg_trgm when data size demands it.
