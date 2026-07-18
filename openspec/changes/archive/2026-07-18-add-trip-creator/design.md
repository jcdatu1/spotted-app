# Design — add-trip-creator

## Context

Explored 2026-07-16. Trips already exist (`draft | published` enum, `published_at`, owner RLS) with a minimal create screen (`src/app/trip/new.tsx`: title + description). The media-storage core from add-profile-media-and-storage provides everything the cover photo needs: `pickAndPrepareImage('cover')` (1600px preset), `uploadImage`, `useSignedUrls`, and the private `trip-media` bucket with own-prefix policies. The mockup has no trip-creator screen; this UI comes from brand guidelines. Decisions confirmed with the user: no Upcoming state — publishing is blocked until the trip's start date arrives (with an explanatory note in the UI); publish stays on the trip thread; editing is draft-only.

## Goals / Non-Goals

**Goals:** full trip creator (title, description, countries, dates, cover); derived Draft/Live/Completed lifecycle; date-gated publishing with clear in-UI explanation; draft editing; trip cards that show real covers and real state.
**Non-Goals:** editing published trips; an Upcoming state; discovery filtering by country or date; per-country legs or geocoding (Mapbox is a later change); video covers.

## Decisions

### D1: Live/Completed are derived, never stored

The `trip_status` enum stays `draft | published`. The data layer exposes `type TripState = 'draft' | 'live' | 'completed'` via `getTripState(trip)`: draft → `draft`; published with `end_date` before today → `completed`; otherwise `live` (the publish gate guarantees `start_date <= today` for every published trip, so "otherwise live" is safe). Storing a third state would need a scheduled job to flip rows at each trip's end date — timezone-fragile infrastructure for a fact the calendar already knows. Date comparison happens in device-local time as ISO `YYYY-MM-DD` string comparison (no Date-object timezone traps).

### D2: Publish gate — client is the UX, a CHECK is the backstop

Publishing is blocked while `start_date` is in the future. The thread screen's draft banner disables/hides the publish button and shows a Space Mono note — "Publishing opens {start date}" — so creators always know *why* (the user explicitly asked for this note). The migration adds `CHECK (status <> 'published' OR start_date <= current_date + 1)` as a write-time backstop: `current_date` is UTC at the server while the client gates in device-local time, so a creator up to UTC+14 could legitimately publish while the server date lags a day — the `+ 1` leniency means the DB never rejects a legitimate local-today publish, while still rejecting far-future publishes from any misbehaving client.

### D3: Dates are `date` columns, nullable in the schema, required by the form

`start_date date` / `end_date date` — day-granular like real itineraries; `timestamptz` would drag timezones into "is it live?". CHECKs: dates are paired (`(start_date IS NULL) = (end_date IS NULL)`), ordered (`start_date <= end_date`), and required for publishing (`status <> 'published' OR start_date IS NOT NULL`). Columns stay nullable because existing rows predate them; the migration backfills existing **published** trips with `published_at::date` for both dates so the publish CHECKs validate. The create/edit forms require both dates (masked `YYYY-MM-DD` Space Mono inputs — same no-native-dependency pattern as the profile birthday field, D6 of add-profile-media-and-storage).

### D4: Countries are `country_codes text[]` on the trip row

ISO 3166-1 alpha-2 codes in a `text[] NOT NULL DEFAULT '{}'` column with a cardinality CHECK (≤ 20). No join table until something queries by country (that's add-follows-and-discovery's problem; a backfill-migration then is cheap). Element format is guaranteed by the client picker (DB checks stay light; per-element regex CHECKs on arrays are awkward in Postgres). The picker reads from a new static `src/lib/countries.ts` (code + English name; flag emoji derived from regional-indicator pairs at render — no assets, on-brand "boarding-pass" detail). No `Intl.DisplayNames` dependency — Hermes Intl support is not worth verifying for a constant list. The form requires at least one country.

### D5: Cover photo — `cover_path` on trips, private trip-media bucket, upload-first

Covers upload to `trip-media` (private + signed URLs) under `{uid}/covers/cover-{unique}.jpg` — a draft's cover must not be publicly fetchable, and trip photos already live in this bucket, so listings batch one `useSignedUrls` call. The public profile bucket is wrong here. Lifecycle mirrors profile media: prepare via the existing `cover` preset → upload → write the row (`cover_path` included in the create INSERT; patched on edit) → best-effort delete the previous object. Upload precedes the row write, so a row never references a missing file; if the row write fails, the fresh upload is best-effort deleted.

### D6: Edit screen is a route restructure plus a shared form

`src/app/trip/[id].tsx` moves to `src/app/trip/[id]/index.tsx` so `src/app/trip/[id]/edit.tsx` can exist (paths unchanged for existing links; use PowerShell `Move-Item` — bash `mv` on directories hits EPERM on this machine). Create and edit render one shared `TripForm` feature component (fields, validation, cover preview) so the two can't drift. The edit entry point sits in the thread screen's draft banner next to publish; it renders only for drafts (`getTripState === 'draft'`), and the data layer's `updateTrip` refuses non-draft trips as a second client-side guard. No DB-level draft-only enforcement: RLS already scopes writes to the owner, and a trigger to freeze published rows would complicate `publishTrip` itself for little MVP value — accepted trade-off.

### D7: Trip cards show cover, state chip, and date meta

`TripCard` gains a `coverUrl` prop rendered with `expo-image` in the existing 80px band (tint placeholder remains the fallback) and `StatusChip` becomes state-driven: Draft = amber tint (as today), Live = coral (the action/now color), Completed = neutral raised surface with muted text. The Space Mono `meta` line renders the date range (e.g. `FEB 12–26 2026`) plus country flag emoji. Profile and Home lists pass the derived state; `listMyTrips`/`listPublishedTrips` callers batch cover paths through `useSignedUrls`.

## Risks / Trade-offs

- [Derived state shifts with the device clock/timezone] → accepted for MVP; a trip flips Live→Completed at local midnight, which matches user intuition better than a server-fixed instant.
- [DB publish-gate leniency (`current_date + 1`)] → a client could publish up to one UTC day early; the real gate is the client UX, the CHECK only stops gross violations.
- [No DB enforcement of draft-only editing] → owner-only RLS still applies; worst case an owner edits their own published trip via a stale client — cosmetic, not a security issue.
- [Existing draft trips have no dates/countries] → they can't publish until edited (publish CHECK + form validation demand dates); the edit screen is the remedy and only staging data exists.
- [`text[]` countries can't be indexed for discovery] → deliberate deferral; a GIN index or join table lands with add-follows-and-discovery if needed.
- [Route restructure (`[id].tsx` → `[id]/index.tsx`) could break links] → expo-router resolves both identically; verify trip navigation in the device walk.

## Migration Plan

One migration (`add_trip_creator_fields`): add `start_date`, `end_date`, `country_codes`, `cover_path`; backfill dates on existing published rows from `published_at`; then add the paired/ordered/publish CHECKs. `supabase db push` to staging, regenerate types, verify on device; prod later per environment convention.

## Open Questions

- None blocking.
