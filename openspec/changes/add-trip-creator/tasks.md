# Tasks — add-trip-creator

## 1. Database

- [x] 1.1 Migration `add_trip_creator_fields`: add `start_date date`, `end_date date`, `country_codes text[] not null default '{}'` (cardinality ≤ 20 CHECK), `cover_path text` to `public.trips`
- [x] 1.2 Same migration: backfill `start_date`/`end_date` on existing published rows from `published_at::date`, then add CHECKs — dates paired (`(start_date is null) = (end_date is null)`), ordered (`start_date <= end_date`), publish requires dates (`status <> 'published' or start_date is not null`), publish gate (`status <> 'published' or start_date <= current_date + 1`)
- [x] 1.3 `supabase db push` to staging; regenerate `src/data/types.ts` via `supabase gen types`

## 2. Countries module

- [x] 2.1 `src/lib/countries.ts`: static ISO 3166-1 alpha-2 list (code + English name), `flagEmoji(code)` from regional-indicator pairs, search helper

## 3. Trips data layer

- [x] 3.1 `trips.ts`: extend `createTrip` input with `countryCodes`, `startDate`, `endDate`, optional `coverPath`; cover upload happens before insert (helper `uploadTripCover(prepared)` → `{uid}/covers/cover-{unique}.jpg` via storage core), best-effort delete on insert failure
- [x] 3.2 `trips.ts`: `updateTrip(id, patch)` + `useUpdateTrip` — refuses non-draft trips client-side; cover replacement uploads first, patches row, best-effort deletes old object
- [x] 3.3 `trips.ts`: `type TripState = 'draft' | 'live' | 'completed'` + `getTripState(trip)` (device-local ISO date-string comparison) + `canPublish(trip)` (draft, has dates, start ≤ today)

## 4. UI — create & edit

- [x] 4.1 `src/features/trips/trip-form.tsx`: shared form (title, description, country multi-select with chips + searchable picker, `YYYY-MM-DD` Space Mono from/to fields, cover picker with band preview) and shared validation (title 1–80, desc ≤ 280, ≥ 1 country, valid ordered dates)
- [x] 4.2 `src/app/trip/new.tsx`: rebuild on `TripForm`; on submit upload cover (if picked) → create → land in thread
- [x] 4.3 Route restructure: move `src/app/trip/[id].tsx` → `src/app/trip/[id]/index.tsx` (PowerShell `Move-Item`); add `src/app/trip/[id]/edit.tsx` on `TripForm`, pre-filled, draft-only (redirect away for non-drafts), visible back button
- [x] 4.4 Thread screen draft banner: add Edit details entry point; gate publish via `canPublish` — when the start date is in the future, disable publish and show the Space Mono note "Publishing opens {start date}"; when dates are missing (legacy drafts), direct to edit

## 5. UI — listings

- [x] 5.1 `trip-card.tsx`: `StatusChip` → derived `TripState` (Draft amber, Live coral, Completed neutral); `coverUrl` prop rendered with `expo-image` in the band (tint fallback); meta line = Space Mono date range + country flag emoji
- [x] 5.2 Profile own-trips list and Home published list: pass derived state, batch `cover_path`s through `useSignedUrls('trip-media', …)`, pass meta from dates/countries

## 6. Verification

- [x] 6.1 Quality gates: `typecheck`, `lint`, `format:check` exit 0
- [ ] 6.2 Device walk: create a trip with countries/dates/cover (lands in thread, card shows cover + flags + dates); future-dated draft shows the "Publishing opens…" note and cannot publish; current-dated trip publishes and badges Live; past-dated trip publishes and badges Completed; edit a draft (fields pre-filled, cover replacement deletes old object); published trip offers no edit entry; pre-existing dateless draft is prompted to add dates before publish
