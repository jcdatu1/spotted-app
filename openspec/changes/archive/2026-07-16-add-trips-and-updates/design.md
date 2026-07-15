# Design — add-trips-and-updates

## Context

Scaffold and auth are archived and live on staging + prod. `profiles` exists; `auth.uid()`-based RLS patterns and the migration pipeline (push staging → gen types → verify → push prod) are proven. This change adds the content model everything else builds on, honoring the locked decisions in the project context — especially #1 (single typed updates table), #2 (`happened_at` ordering), #3 (per-currency money, shared `amount` column), and #6 (copying is a projection — nothing here may assume updates get duplicated).

## Goals / Non-Goals

**Goals:**
- Creator: create a draft trip → post note/photo/purchase/attraction updates from an in-thread composer → publish.
- Reader: open a published trip from the Home list → read typed bubbles in `happened_at` order → see a per-currency budget in the header.
- The schema encodes validity (CHECKs), visibility (RLS), and the budget (view) — the client stays thin.

**Non-Goals:**
- Video (enum value reserved; no UI, no Mux), maps (`location geography` column deferred to `add-map-view` along with the PostGIS extension — avoids typegen friction now for a column nothing reads), reactions/saves, itinerary copy, follows, update edit/delete, `happened_at` picker UI (defaults to now; column semantics preserved so backfill can be added without migration).

## Decisions

### D1: Schema
```sql
create type update_type as enum ('note','photo','video','purchase','attraction'); -- video reserved
create type trip_status as enum ('draft','published');

trips (
  id uuid pk default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  title text not null check (1..80), description text check (<=280),
  status trip_status not null default 'draft', published_at timestamptz,
  created_at, updated_at
)

updates (
  id uuid pk, trip_id fk cascade, author_id fk profiles,
  type update_type not null,
  happened_at timestamptz not null default now(),   -- thread order
  created_at timestamptz not null default now(),
  body text check (<=1000),                          -- note text / caption
  place_name text, vendor_name text,
  amount numeric(12,2) check (>=0), currency char(3),
  media_path text,
  CHECK (type <> 'note'       OR body is not null),
  CHECK (type <> 'photo'      OR media_path is not null),
  CHECK (type <> 'purchase'   OR (amount is not null AND currency is not null AND vendor_name is not null)),
  CHECK (type <> 'attraction' OR place_name is not null),   -- entry fee optional (free attractions)
  CHECK (amount is null OR currency is not null)
)
```
Indexes: `updates (trip_id, happened_at)`, `trips (owner_id)`, `trips (status, published_at desc)`. *Alternatives (JSONB payload, per-type child tables) were rejected at project level — locked decision #1.*

### D2: Budget as a security-invoker view
`trip_budgets` = `select trip_id, currency, sum(amount) as total, count(*) as items from updates where type in ('purchase','attraction') and amount is not null group by 1,2`, created `with (security_invoker = true)` so the underlying `updates` RLS applies to the caller. The client renders one line per currency ("฿4,280 · $120") — no FX, per decision #3. *Alternative:* client-side summing over fetched updates — works for one screen but breaks once budgets appear on cards/lists that don't fetch full threads.

### D3: RLS — trips own visibility; updates delegate
- `trips` SELECT: `status = 'published' OR owner_id = auth.uid()` (authenticated); INSERT/UPDATE/DELETE: owner only (`with check` pins `owner_id`). Publishing = owner UPDATE setting `status='published', published_at=now()`.
- `updates` SELECT: `EXISTS` subquery against visible trips — trip visibility is defined in exactly one place; INSERT: caller must own the parent trip AND `author_id = auth.uid()`; UPDATE/DELETE: same (unused by UI this change).

### D4: Storage — private bucket, owner-prefixed paths, batched signed URLs
Bucket `trip-media` (private) created in the migration (insert into `storage.buckets`) with `storage.objects` policies: INSERT/DELETE only when the first path folder equals `auth.uid()`; SELECT for authenticated. Upload path: `{userId}/{tripId}/{uuid}.jpg`. Rendering: `createSignedUrls()` batched per thread (1h expiry) inside a TanStack Query keyed by the photo paths — one round trip per thread, cached. *Alternative:* public bucket + public URLs — simpler but violates the authenticated-only MVP visibility decision the moment a URL leaks.

### D5: Data layer exposes a discriminated union
`src/data/updates.ts` maps rows to `Update = NoteUpdate | PhotoUpdate | PurchaseUpdate | AttractionUpdate` (narrowed, non-null fields per variant) and accepts a matching discriminated input for `createUpdate` — components never see nullable soup. Unknown/`video` rows are filtered out defensively. `trips.ts`: `createTrip`, `publishTrip`, `listMyTrips`, `listPublishedTrips`, `getTrip`; `media.ts`: `uploadTripPhoto` (expo-image-picker asset → ArrayBuffer → storage), `useSignedPhotoUrls`.

### D6: Routes and navigation
`trip/new` and `trip/[id]` live in the root stack inside the existing session guard (not in the tabs group — they're pushed screens, not tabs), with themed headers per the back-button convention. Thread screen composition: `BudgetHeader` + inverted-feel FlatList of `UpdateBubble` (switch on `type`) + `ComposerBar` (owner only) + publish action (owner + draft only). Composer: four type buttons open a type-specific input sheet; posting invalidates the thread + budget queries.

### D7: Promotion protocol (established last change)
Push staging → gen types → verify (gates, bundle, API-level RLS spot-checks, device) → push prod. Storage bucket + policies ride in the migration so prod gets identical setup.

## Risks / Trade-offs

- [Signed URLs expire (1h) → stale image URLs on long-open threads] → Query `staleTime` below expiry so re-render refetches; acceptable MVP behavior.
- [Draft leakage would be the worst RLS failure] → API spot-check explicitly asserts: non-owner cannot see a draft trip, its updates, or its budget rows; non-owner insert into someone else's trip fails.
- [Currency free-text (char(3)) could accumulate junk] → Composer offers a fixed common-currency picker (THB, USD, EUR, JPY, PHP, …) defaulting to the trip's last-used currency; DB accepts any ISO-3 shape.
- [Home list + health card both on Home] → Health card moves below the list, unchanged behavior — scaffold spec requirement still satisfied.
- [Photo upload on flaky mobile networks] → Upload happens before insert; a failed upload never creates a rowless photo update. Retry is manual (re-tap) at MVP.

## Migration Plan

1. Migration 2 on staging (`db push`), `gen types --linked` → types.ts.
2. Verify: gates → bundle → API RLS spot-checks → device walk (create → post 4 types → publish → open as second user → budget).
3. `db push` to prod. Rollback: drop view/tables/types + bucket rows (no dependents yet).

## Open Questions

- None blocking. Currency picker's default list can be tuned later; `happened_at` editing lands with a future composer-polish change.
