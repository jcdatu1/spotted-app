# trip-engagement — delta spec

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Counts are exposed per trip and surfaced on trip cards

The system SHALL expose per-trip view and save counts through a `trip_engagement` view whose row visibility follows trip RLS, read through the typed data layer as a batched per-id map. Profile trip cards (owner and audience surfaces, all tabs) SHALL display each trip's view count and save count as mono chips (views muted, saves teal). Home feed cards SHALL display each trip's view count and save count as the footer's right-aligned mono stats (VIEWS in ink, SAVES in teal), replacing the former STOPS/DAYS stats while keeping the footer's format. The data-layer stops count remains available; no card renders stops or day counts.

#### Scenario: Profile card shows counts

- **WHEN** a profile's trip list renders for a trip with 3 views and 1 save
- **THEN** its card shows "3 views" and "1 save" chips and no stops chip

#### Scenario: Feed card shows counts

- **WHEN** the home feed renders a published trip with 12 views and 4 saves
- **THEN** its card footer shows mono stats "12 VIEWS" and "4 SAVES" (saves teal) and no stops or days stats
