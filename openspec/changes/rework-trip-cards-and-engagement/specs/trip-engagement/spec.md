# trip-engagement — delta spec

## ADDED Requirements

### Requirement: Views and saves are per-user edge rows

The system SHALL store trip views in a `trip_views` table and trip saves in a `trip_saves` table, each keyed `(trip_id, user_id)` (one row per user per trip, cascade-deleted with the trip or user). RLS SHALL allow: SELECT to any authenticated user; INSERT only where `auth.uid() = user_id` AND the target trip is published AND the caller does not own it; DELETE only on `trip_saves` for the caller's own row. Views SHALL never be updatable or deletable by clients.

#### Scenario: Owner views never count

- **WHEN** a trip owner opens their own trip, or a client attempts to insert a view/save row for a trip the caller owns
- **THEN** no row is recorded and the database rejects the insert regardless of client behavior

#### Scenario: Draft trips accrue nothing

- **WHEN** any insert targets a draft trip
- **THEN** the database rejects it

#### Scenario: Re-opening is idempotent

- **WHEN** the same user opens the same published trip repeatedly
- **THEN** at most one view row exists for that (trip, user) pair

### Requirement: A non-owner opening a published thread records a view

The trip thread SHALL record a view (idempotent upsert through the typed data layer) when a signed-in non-owner opens a published trip. Owners and draft threads SHALL trigger no recording.

#### Scenario: Reader generates one view

- **WHEN** a signed-in non-owner opens a published trip's thread for the first time
- **THEN** the trip's view count increases by one, and does not increase on subsequent opens by the same user

### Requirement: Non-owners can save and unsave a trip from its thread

The trip thread SHALL show a Save/Saved toggle (teal, per brand: teal = saves) to signed-in non-owners on published trips: saving inserts the caller's save row, unsaving deletes it, the control is disabled while the mutation pends, and the state persists across sessions. Owners SHALL see no save control.

#### Scenario: Save then unsave

- **WHEN** a non-owner taps Save on a published trip and later taps Saved
- **THEN** the save row is created then deleted, the toggle reflects each state, and the trip's save count changes accordingly

#### Scenario: Owner sees no save control

- **WHEN** an owner views their own trip
- **THEN** no Save toggle is rendered

### Requirement: Counts are exposed per trip and surfaced on profile trip cards

The system SHALL expose per-trip view and save counts through a `trip_engagement` view whose row visibility follows trip RLS, read through the typed data layer as a batched per-id map. Profile trip cards (owner and audience surfaces) SHALL display each trip's view count and save count as mono chips (views muted, saves teal), replacing the former stops chip. The data-layer stops count remains available; the stops chip is no longer rendered.

#### Scenario: Card shows counts

- **WHEN** a profile's trip list renders for a trip with 3 views and 1 save
- **THEN** its card shows "3 views" and "1 save(s)" chips and no stops chip

### Requirement: The profile saves stat is the creator's total saves

Both profile surfaces (owner Profile tab and audience `/user/[id]`) SHALL display the saves stat as the sum of save counts across that user's trips, updating after save/unsave actions reach the server.

#### Scenario: Creator total reflects a new save

- **WHEN** a reader saves one of a creator's published trips
- **THEN** the creator's profile saves stat is one higher on next fetch of either profile surface
