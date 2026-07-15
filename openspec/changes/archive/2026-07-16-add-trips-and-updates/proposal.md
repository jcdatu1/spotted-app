# add-trips-and-updates

## Why

This is the hero slice — the change that proves the product thesis. A creator can start a trip, post typed updates (note, photo, purchase, attraction), and publish; any signed-in user can open the trip and read the journey as a chat-style thread with a live per-currency budget rolled up from the typed records. Everything before this was plumbing; everything after this (follows, saves, itinerary copy) decorates this core loop.

## What Changes

- Second migration: `trips` table (draft/published lifecycle, owner) and `updates` table — ONE table with a `type` enum + typed nullable columns and per-type CHECK constraints (locked decision #1); `video` is reserved in the enum but not offered in the UI. `happened_at` drives thread ordering (decision #2). Purchase and attraction share `amount + currency` (decision #3). A `trip_budgets` view rolls budgets up per currency (no FX).
- RLS: published trips readable by any authenticated user, drafts owner-only; updates inherit trip visibility; only the trip owner can post/edit updates (decisions #4/#5).
- Supabase Storage: private `trip-media` bucket with owner-scoped upload policies; photos rendered via batched signed URLs.
- Creator flow: create-trip screen, "Your trips" list on the Profile tab, in-thread composer with type-specific forms (note/photo/purchase/attraction, photo via image picker), and a publish action.
- Reader flow: trip thread screen — typed bubble cards ordered by `happened_at`, budget rollup in the header, visible back button (convention).
- Discovery stub: the Home tab lists published trips (dev-grade list, keeps the existing health card); the real feed arrives with `add-follows-and-discovery`.

Out of scope: video (Mux), maps/geocoding (`location` column deferred to `add-map-view`), reactions/saves, itinerary copy, editing `happened_at` in the composer (column semantics honored; picker UI deferred), edit/delete of updates, follows.

## Capabilities

### New Capabilities

- `trips`: Trip lifecycle — create as draft, publish, owner-scoped writes, visibility rules, the creator's own-trips list, and the dev-grade published-trips list on Home.
- `trip-updates`: The typed update stream — single-table model with per-type validation, chat-thread rendering ordered by `happened_at`, the composer for posting each type, and photo storage.
- `trip-budget`: Read-only per-currency budget rollup derived from purchase amounts and attraction entry fees, displayed in the trip thread.

### Modified Capabilities

_None — Home keeps its health-check requirement; the trips list is additive (part of `trips`)._

## Impact

- **Code**: New migration + storage policies; `src/data/trips.ts`, `src/data/updates.ts`, `src/data/media.ts`; regenerated types; new routes `trip/new` and `trip/[id]` (session-guarded, themed headers with back buttons); feature folders `src/features/trips/`, `src/features/trip-thread/`, `src/features/composer/`; Home screen gains the published list.
- **Dependencies**: `expo-image-picker` (photo capture/selection), `expo-image` (performant thread images).
- **Systems**: Staging then prod receive the migration and the `trip-media` bucket.
- **Follow-on**: Unblocks `add-follows-and-discovery` (feed over published trips) and `add-itinerary-copy` (projection over the typed subset).
