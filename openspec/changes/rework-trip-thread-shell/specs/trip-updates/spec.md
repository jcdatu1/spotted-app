# trip-updates — delta spec

## RENAMED Requirements

- FROM: `### Requirement: Owner posts updates from the in-thread composer`
- TO: `### Requirement: Owner posts updates via the center + button composer sheet`

## MODIFIED Requirements

### Requirement: The thread renders updates in happened_at order

The trip thread SHALL render updates as chat-style bubble cards ordered by `happened_at` ascending, each styled per its type (note bubble; photo card; purchase card showing vendor, amount, currency; attraction card showing place and entry fee when present), using brand tokens (mono for money/dates). Alignment SHALL be viewer-relative: when the viewer owns the trip, all updates (and their timestamps) render right-aligned (outbound); for any other viewer they render left-aligned (inbound). Alignment is the only viewer-dependent styling — per-type card styling is identical on both sides.

#### Scenario: Read a thread

- **WHEN** a user opens a trip with updates of all four types
- **THEN** all updates render as their distinct card types in `happened_at` order

#### Scenario: Owner sees their thread as outbound

- **WHEN** the trip owner opens their own trip
- **THEN** every update and its timestamp is right-aligned, with card styling otherwise unchanged

#### Scenario: Reader sees the thread as inbound

- **WHEN** a non-owner opens the same trip
- **THEN** every update and its timestamp is left-aligned

#### Scenario: Empty thread

- **WHEN** a trip with no updates is opened
- **THEN** an explicit empty state is shown (owner sees a prompt pointing at the + button; readers see "no updates yet")

### Requirement: Owner posts updates via the center + button composer sheet

For the trip owner viewing their own thread (draft or published), the tab bar's center + button SHALL open an update-type picker offering the four types (note, photo, purchase, place); choosing a type SHALL open that type's form as a bottom sheet over the thread, with type-specific fields and client-side validation mirroring the CHECK constraints. Posting SHALL append the update to the thread and close the sheet without leaving the screen. No inline composer bar SHALL be rendered in the thread. Non-owners SHALL have no composer entry point on the thread (the + button retains its default trip-creation behavior per project-scaffold).

#### Scenario: Post a note

- **WHEN** the owner taps +, picks Note, and submits body text
- **THEN** the note appears in the thread and the sheet closes

#### Scenario: Post a purchase

- **WHEN** the owner taps +, picks Purchase, and submits vendor, amount, and currency
- **THEN** the purchase card appears in the thread and the budget rollup reflects it

#### Scenario: Reader gets no composer

- **WHEN** a non-owner views a published trip
- **THEN** no composer surface exists and tapping + opens the trip creation flow
