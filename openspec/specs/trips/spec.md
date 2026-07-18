# trips Specification

## Purpose

Trip lifecycle — create as draft, publish, owner-scoped writes, visibility rules, the creator's own-trips list, and the dev-grade published-trips list on Home (real discovery arrives with add-follows-and-discovery).

## Requirements

### Requirement: Creator can create a trip as a draft
The system SHALL allow a signed-in user to create a trip with a title (1–80 chars), an optional description (≤280 chars), at least one country (ISO 3166-1 alpha-2 codes, multi-select from a static list, max 20), a from/to date range (day-granular `start_date`/`end_date`, `start_date <= end_date`, entered as validated `YYYY-MM-DD` fields), and an optional cover photo (picked and prepared via the media-storage `cover` preset, uploaded to the creator's own prefix in the private `trip-media` bucket before the row is written). New trips SHALL start in `draft` status, owned by their creator.

#### Scenario: Create a trip
- **WHEN** a signed-in user submits the create-trip form with a valid title, at least one country, and a valid date range
- **THEN** a draft trip owned by them is created with those fields persisted and they land in its (empty) thread

#### Scenario: Create a trip with a cover photo
- **WHEN** the user picks a cover photo and submits a valid form
- **THEN** the prepared image is uploaded to their own prefix in `trip-media` and the created trip's `cover_path` references it

#### Scenario: Invalid title rejected
- **WHEN** a trip is submitted with an empty title
- **THEN** the form shows a validation error and nothing is created

#### Scenario: Invalid date range rejected
- **WHEN** a trip is submitted with a to-date earlier than the from-date, or with only one of the two dates
- **THEN** the form shows a validation error, nothing is created, and the database rejects such rows regardless of client state

#### Scenario: Missing country rejected
- **WHEN** a trip is submitted with no country selected
- **THEN** the form shows a validation error and nothing is created

### Requirement: Country picker presents as a partial-height sheet
The trip form's country picker SHALL open as a slide-up bottom sheet covering approximately 80% of the screen height, with a dimmed backdrop above it, leaving the top of the screen (including the iOS status bar area) visible and untouched by picker content. Tapping the backdrop SHALL dismiss the sheet, equivalent to Done.

#### Scenario: Sheet clears the status bar
- **WHEN** the user opens the country picker on an iOS device
- **THEN** the sheet rises to ~80% of the screen and no picker content renders under the status bar or notch

#### Scenario: Backdrop dismisses
- **WHEN** the user taps the dimmed area above the open sheet
- **THEN** the sheet closes and the selections made so far are kept

### Requirement: Creator can publish a trip
The system SHALL let a trip's owner publish a draft trip, setting `status = 'published'` and `published_at`. Publishing SHALL be available from the trip thread for drafts only, and SHALL be blocked while the trip's `start_date` is in the future (device-local): the publish affordance SHALL be disabled with a visible note stating when publishing opens (e.g. "Publishing opens {start date}"). A database CHECK SHALL reject publishing a trip whose `start_date` is more than one day after the server's current UTC date, and publishing SHALL require the trip to have a date range.

#### Scenario: Publish a started trip
- **WHEN** the owner taps publish on a draft trip whose start date is today or in the past
- **THEN** the trip becomes published and immediately appears in the published-trips list

#### Scenario: Future trip cannot be published
- **WHEN** the owner views their draft trip whose start date is after today
- **THEN** the publish action is unavailable and a note explains that publishing opens on the trip's start date

#### Scenario: Publish requires dates
- **WHEN** a publish is attempted for a draft trip without a date range (e.g. a pre-existing trip)
- **THEN** the operation is rejected and the creator is directed to add dates first

### Requirement: Trip lifecycle state is derived from status and dates
The system SHALL derive a trip's lifecycle state at read time — `draft` (status draft), `live` (published and today is within `start_date`..`end_date`), `completed` (published and `end_date` is before today) — with no stored live/completed value and no scheduled state transitions. The data layer SHALL expose this via a single helper used by all surfaces, comparing dates in device-local time. Trip listings (own trips, published trips) SHALL badge trips with the derived state (Draft / Live / Completed).

#### Scenario: Trip in progress reads as Live
- **WHEN** a published trip's date range includes today
- **THEN** its derived state is `live` and listings badge it Live

#### Scenario: Past trip reads as Completed
- **WHEN** a published trip's `end_date` is before today
- **THEN** its derived state is `completed` and listings badge it Completed

#### Scenario: Live trip crosses its end date
- **WHEN** today advances past a published trip's `end_date`
- **THEN** the trip reads as `completed` on next render with no database write having occurred

### Requirement: Draft trips are editable
The system SHALL provide an edit-trip screen (pushed, with a visible back button) for the trip's owner covering title, description, countries, dates, and cover photo, with the same validation as creation. The edit entry point SHALL be available only while the trip is a draft, and the data layer SHALL refuse detail edits to non-draft trips. Replacing a cover SHALL upload the new image before patching the row and then best-effort delete the previous object.

#### Scenario: Edit a draft
- **WHEN** the owner opens edit from their draft trip's thread, changes fields, and saves
- **THEN** they return to the thread with the changes persisted and reflected immediately

#### Scenario: Published trips are not editable
- **WHEN** a trip is published
- **THEN** no edit entry point is offered for it

#### Scenario: Replace a draft cover
- **WHEN** the owner replaces a draft trip's cover photo
- **THEN** the new image is uploaded and referenced by the trip, and the previous object is deleted from storage

### Requirement: Trip cards render cover, state, and dates
Trip cards SHALL render the trip's cover photo (via batched signed URLs from the `trip-media` bucket) with the existing tint placeholder as fallback, the derived-state chip, and a Space Mono meta line carrying the trip's date range and country flag emoji (derived from ISO codes, no image assets).

#### Scenario: Card with cover and dates
- **WHEN** a trip with a cover and dates appears in a listing
- **THEN** its card shows the cover image, its derived-state chip, and a date-range meta line with country flags

#### Scenario: Card without cover
- **WHEN** a trip has no cover photo
- **THEN** its card falls back to the tint placeholder band

### Requirement: Trip visibility is enforced by RLS
Published trips SHALL be readable by any authenticated user; draft trips SHALL be readable only by their owner. All trip writes (create/update/delete) SHALL be restricted to the owner, with `owner_id` pinned to `auth.uid()` on insert.

#### Scenario: Draft hidden from others
- **WHEN** an authenticated non-owner queries another user's draft trip
- **THEN** zero rows are returned

#### Scenario: Published trip readable
- **WHEN** an authenticated user queries a published trip
- **THEN** the trip row is returned

#### Scenario: Non-owner cannot modify a trip
- **WHEN** an authenticated user attempts to update or delete a trip they do not own
- **THEN** the operation affects zero rows

### Requirement: Creator sees their own trips
The Profile tab SHALL list the signed-in user's trips (drafts and published, newest first) with status shown, an entry point to create a new trip, and navigation into each trip's thread.

#### Scenario: Own trips listed
- **WHEN** a creator with trips opens the Profile tab
- **THEN** their trips are listed with draft/published status and tapping one opens its thread

### Requirement: Trip listings expose a stops count
The trips data layer SHALL expose, for the owner's trip list, the number of updates ("stops") each trip contains, computed from existing tables under existing RLS (no denormalized counters). UI surfaces MAY render this as a stops chip.

#### Scenario: Trip with updates shows its count
- **WHEN** the owner's trip list is fetched for a trip that has 3 updates
- **THEN** the trip's stops count is 3

#### Scenario: Empty trip shows zero
- **WHEN** the owner's trip list is fetched for a trip with no updates
- **THEN** the trip's stops count is 0

### Requirement: Published trips are browsable from Home
The Home tab SHALL list published trips (newest published first) with title and creator name, navigating into the trip thread on tap. This is the dev-grade discovery stub; the Home screen SHALL carry no backend-status card.

#### Scenario: Browse published trips
- **WHEN** a signed-in user opens Home while published trips exist
- **THEN** the trips are listed and tapping one opens its thread with a visible back button

#### Scenario: Home is trips-only
- **WHEN** a signed-in user opens Home
- **THEN** no backend health/status card renders above or below the trip list
