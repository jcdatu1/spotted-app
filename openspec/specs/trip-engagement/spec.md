# trip-engagement Specification

## Purpose

Views and saves — the signal for whether anyone actually reads a trip. Per-user edge storage and RLS, view-recording and save-toggle semantics on the thread, the counts surfaced on trip cards and profile stats, and the browsable saved-trips list.

## Requirements

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

### Requirement: Counts are exposed per trip and surfaced on trip cards
The system SHALL expose per-trip view and save counts through a `trip_engagement` view whose row visibility follows trip RLS, read through the typed data layer as a batched per-id map. Profile trip cards (owner and audience surfaces, all tabs) SHALL display each trip's view count and save count as mono chips (views muted, saves teal). Home feed cards SHALL display each trip's view count and save count as the footer's right-aligned mono stats (VIEWS in ink, SAVES in teal), replacing the former STOPS/DAYS stats while keeping the footer's format. The data-layer stops count remains available; no card renders stops or day counts.

#### Scenario: Profile card shows counts
- **WHEN** a profile's trip list renders for a trip with 3 views and 1 save
- **THEN** its card shows "3 views" and "1 save" chips and no stops chip

#### Scenario: Feed card shows counts
- **WHEN** the home feed renders a published trip with 12 views and 4 saves
- **THEN** its card footer shows mono stats "12 VIEWS" and "4 SAVES" (saves teal) and no stops or days stats

### Requirement: The profile saves stat is the creator's total saves
Both profile surfaces (owner Profile tab and audience `/user/[id]`) SHALL display the saves stat as the sum of save counts across that user's trips, updating after save/unsave actions reach the server.

#### Scenario: Creator total reflects a new save
- **WHEN** a reader saves one of a creator's published trips
- **THEN** the creator's profile saves stat is one higher on next fetch of either profile surface

### Requirement: A user's saved trips are browsable
The system SHALL expose, through the typed data layer, the list of trips a given user has saved (from `trip_saves` by saver, newest save first), each joined to its trip and the trip's owner identity, with rows the viewer cannot read (per trip RLS) silently omitted. Profile surfaces SHALL render this list under a **Saved** tab as boarding-pass cards carrying creator attribution (`by @username`), the trip's status badge, and its view/save count chips; tapping a card SHALL open the trip's thread. Saved lists SHALL be readable by any authenticated user (public-in-app, matching follows and engagement counts). A user's own Saved tab SHALL reflect save/unsave actions without an app restart.

#### Scenario: Saved tab lists saved trips
- **WHEN** a user who has saved two published trips opens their profile's Saved tab
- **THEN** both trips render as cards (newest save first) with the creator's username, and tapping one opens its thread

#### Scenario: Unsave removes the card
- **WHEN** the user unsaves a trip from its thread and returns to their Saved tab
- **THEN** that trip no longer appears in the list

#### Scenario: Another user's saved list is visible
- **WHEN** a viewer opens the Saved tab on someone else's profile
- **THEN** the trips that user saved render, limited to trips the viewer is allowed to read
