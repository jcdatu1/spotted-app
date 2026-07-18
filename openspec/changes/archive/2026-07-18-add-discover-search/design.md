# Design — add-discover-search

## Context

First real content for the Discover tab (placeholder since update-profile-cta-and-bottom-nav). The mockup's discovery screen shows a search icon but no dedicated search UI — this surface is designed fresh within brand conventions. Decisions below settled in explore mode: posts = trips only, audience profile in scope, live search-as-you-type, ILIKE via the data layer.

## Goals / Non-Goals

**Goals:** typed search across users/trips/countries with live results; user results tappable through to a read-only audience profile; recent searches as the empty-state recommendation layer; zero migrations.
**Non-Goals:** follows, update-body search, trending terms, typo tolerance/ranking infrastructure, server-side history, pagination beyond capped result lists.

## Decisions

### D1: Search runs client-orchestrated ILIKE queries, no migration
`src/data/search.ts` exposes `useSearch(query)`: one TanStack Query keyed `['search', normalizedQuery]` that runs profile and trip ILIKE queries in parallel (`or(username.ilike.%q%, display_name.ilike.%q%)`; `or(title.ilike.%q%, description.ilike.%q%)` with `status = 'published'` explicit for intent, though RLS already guarantees it), capped at 10 rows each, `%`/`_` escaped from user input. Countries never hit the network — `searchCountries()` from `src/lib/countries.ts` runs synchronously. Minimum 2 characters; the screen debounces input ~300ms before the query key updates. The hook returns `{ countries, users, trips }` so a future `search_all` RPC or pg_trgm upgrade swaps the internals without touching the UI.

### D2: Live results are the prediction layer
No two-phase suggest-then-submit. Typing renders the sectioned results directly (countries first — instant and exact — then users, then trips), each section omitted when empty. When the input is empty the screen shows **recent searches** (last 10 distinct terms, stored device-local via the existing Zustand + AsyncStorage pattern, tap to re-run, single Clear action). Committing a search (submit or tapping a result) records the term.

### D3: Audience profile is a thin reuse of the owner profile
New route `src/app/user/[id].tsx` (single file — avoids the directory route-name quirk), registered in the root layout with `pushedHeader` and empty title. Screen reuses `ProfileHeader` with its `action` slot empty (reserved for Follow), the stats row (followers/saves 0, trips = count of *published* trips), and the published-trips list rendered as TripCards. No CTA card, no drafts, no edit, no sign-out. Data: `getProfileById(id)` (profiles are app-wide readable) and `usePublishedTripsByOwner(id)` (RLS returns published only for non-owners). Searching yourself shows the same audience view — no special-casing; your tab profile remains the owner surface.

### D4: Country results drill into a country-scoped trip list
Tapping a country result switches the results area to published trips whose `country_codes` contains that code (`.contains()` array filter via `usePublishedTripsByCountry`), headed by the flag + name with a clear/back affordance to return to the text query. This keeps countries useful without a new screen; a dedicated country page can come with real discovery.

### D5: User rows follow list conventions
Avatar left (40px circle, public-URL thumbnail; initial-in-circle placeholder when no avatar — matching the profile header's display-surface fallback), display name + `@username` (Space Mono) right of it. Rows are plain pressables in a bordered `surfaceRaised` card, consistent with the Settings row pattern.

## Risks / Trade-offs

- [ILIKE substring match won't scale or rank well] → fine at current data size; hook shape isolates the swap to `search.ts` internals (D1).
- [Debounce + parallel queries can race] → single query key per normalized term; TanStack Query cancels/ignores stale results by key.
- [Audience profile shows stats that are placeholder zeros] → consistent with the owner profile's existing behavior; follows change makes them real.
- [Viewing your own audience page may confuse] → acceptable; it's reachable only by searching yourself.
- [Recent searches are device-local] → intentional MVP; server history is a later, consent-worthy feature.

## Migration Plan

Code-only; no database changes. Normal gates + device walk (search each type, country drill-down, audience profile from a user result, recent searches persist across restart).

## Open Questions

- None blocking.
