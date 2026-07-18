# Tasks — add-discover-search

## 1. Data layer

- [x] 1.1 `src/data/search.ts`: `useSearch(query)` — normalized/escaped term, parallel profile + trip ILIKE queries (capped 10 each), countries via `searchCountries()`, single query key, min 2 chars
- [x] 1.2 `src/data/profiles.ts`: `getProfileById(id)` + `useProfile(id)` for the audience view
- [x] 1.3 `src/data/trips.ts`: `usePublishedTripsByOwner(ownerId)` and `usePublishedTripsByCountry(code)`

## 2. Discover screen

- [x] 2.1 Search input at top of `discover.tsx` (brand-styled, clear button, ~300ms debounce, keyboard-friendly)
- [x] 2.2 Sectioned live results: COUNTRIES (flag + name rows), USERS (avatar-left rows per D5), TRIPS (TripCards with signed covers); sections hidden when empty; sensible loading/empty messaging
- [x] 2.3 Country drill-down: tap country → published trips containing that code, with header + clear affordance back to the text query
- [x] 2.4 Recent searches (Zustand + AsyncStorage): last 10 distinct terms when input empty, tap to re-run, Clear action; record on submit/result tap

## 3. Audience profile

- [x] 3.1 `src/app/user/[id].tsx` + `Stack.Screen` registration with `pushedHeader` (chevron back, empty title)
- [x] 3.2 Audience screen: `ProfileHeader` with empty action slot, stats row (published trip count), published TripCards list; loading/error states
- [x] 3.3 Wire user search results (and nothing else yet) to `/user/[id]`

## 4. Documentation

- [x] 4.1 SPOTTED_BIBLE.md: Discover feature entry, audience profile route in the navigation map, search data-layer reference, changelog

## 5. Verification

- [x] 5.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0 _(all pass, 2026-07-18)_
- [x] 5.2 Device walk: search finds a user/trip/country; country drill-down lists the right trips; user result opens the audience profile (published trips only, no edit/sign-out); recent searches persist across an app restart _(verified on device, 2026-07-18)_
