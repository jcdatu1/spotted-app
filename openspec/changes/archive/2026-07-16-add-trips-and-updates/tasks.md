# Tasks — add-trips-and-updates

## 1. Schema, Storage & Types

- [x] 1.1 Write migration 2: `update_type` + `trip_status` enums, `trips` and `updates` tables with per-type CHECK constraints, indexes (`updates(trip_id, happened_at)`, `trips(owner_id)`, `trips(status, published_at desc)`), `updated_at` trigger on trips
- [x] 1.2 Add RLS in the same migration: trips (published-or-owner SELECT; owner-only writes with pinned `owner_id`), updates (SELECT via parent-trip visibility; writes require trip ownership + `author_id = auth.uid()`)
- [x] 1.3 Add `trip_budgets` security-invoker view (per-currency sum + count over costed updates)
- [x] 1.4 Add `trip-media` private bucket + `storage.objects` policies (owner-prefix INSERT/DELETE, authenticated SELECT) in the migration
- [x] 1.5 `npx supabase db push` to staging; regenerate `src/data/types.ts` via `gen types --linked`

## 2. Data Layer

- [x] 2.1 Install `expo-image-picker` and `expo-image`
- [x] 2.2 Create `src/data/trips.ts`: `createTrip`, `getTrip`, `publishTrip`, `listMyTrips`, `listPublishedTrips` (+ TanStack hooks with invalidation)
- [x] 2.3 Create `src/data/updates.ts`: discriminated `Update` union + narrowing mapper, `listUpdates(tripId)` ordered by `happened_at`, typed `createUpdate`, `getTripBudget` from the view (+ hooks; posting invalidates thread + budget)
- [x] 2.4 Create `src/data/media.ts`: `uploadTripPhoto` (picker asset → ArrayBuffer → owner-prefixed path) and `useSignedPhotoUrls` (batched signed URLs, staleTime under expiry)

## 3. Trips UI

- [x] 3.1 Add `trip/new` route (root stack, session-guarded, themed header/back): title + description form → creates draft → replaces route with the new thread
- [x] 3.2 Profile tab: "Your trips" list (status badge, newest first) + "New trip" button
- [x] 3.3 Home tab: published-trips list (title, creator display name) above the existing health card

## 4. Trip Thread & Composer

- [x] 4.1 Add `trip/[id]` route with themed header (back button) showing trip title; not-found/invisible trips show an explicit error state
- [x] 4.2 Build `src/features/trip-thread/`: bubble cards for note/photo/purchase/attraction (brand tokens; mono for money/dates; expo-image for photos), `happened_at` ordering, empty states (owner vs reader)
- [x] 4.3 Budget header: per-currency lines from `useTripBudget`, hidden when no costed updates
- [x] 4.4 Build `src/features/composer/`: owner-only bar with four type buttons and type-specific forms (validation mirrors CHECKs; currency picker with common currencies defaulting to trip's last-used)
- [x] 4.5 Photo flow: pick → upload → insert row → thread refresh; failed upload shows error and creates no row
- [x] 4.6 Publish action in thread for owner+draft: confirm → publish → status reflects everywhere (Home list, Profile list)

## 5. Verification & Promotion

- [x] 5.1 Quality gates (`typecheck`, `lint`, `format:check`) + full Metro bundle export pass
- [x] 5.2 API RLS spot-check with two users: draft trip/updates/budget invisible to non-owner; non-owner update insert rejected; published trip + updates readable; storage upload to foreign prefix rejected _(8/8 assertions passed against staging, 2026-07-16; test users deleted)_
- [x] 5.3 Device verification (Expo Go + staging): create trip → post all four types (incl. photo) → budget rolls up per currency → publish → second account opens from Home and reads the thread _(verified on device, 2026-07-16)_
- [x] 5.4 Promote to prod: `db push`, verify bucket + view exist; re-link staging _(done 2026-07-16: both migrations on prod, CLI re-linked to staging)_
