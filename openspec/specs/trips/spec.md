# trips Specification

## Purpose

Trip lifecycle — create as draft, publish, owner-scoped writes, visibility rules, the creator's own-trips list, and the dev-grade published-trips list on Home (real discovery arrives with add-follows-and-discovery).

## Requirements

### Requirement: Creator can create a trip as a draft
The system SHALL allow a signed-in user to create a trip with a title (1–80 chars) and optional description (≤280 chars). New trips SHALL start in `draft` status, owned by their creator.

#### Scenario: Create a trip
- **WHEN** a signed-in user submits the create-trip form with a valid title
- **THEN** a draft trip owned by them is created and they land in its (empty) thread

#### Scenario: Invalid title rejected
- **WHEN** a trip is submitted with an empty title
- **THEN** the form shows a validation error and nothing is created

### Requirement: Creator can publish a trip
The system SHALL let a trip's owner publish a draft trip, setting `status = 'published'` and `published_at`. Publishing SHALL be available from the trip thread for drafts only.

#### Scenario: Publish a draft
- **WHEN** the owner taps publish on their draft trip
- **THEN** the trip becomes published and immediately appears in the published-trips list

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

### Requirement: Published trips are browsable from Home
The Home tab SHALL list published trips (newest published first) with title and creator name, navigating into the trip thread on tap. This is the dev-grade discovery stub; the Home health-check card remains present.

#### Scenario: Browse published trips
- **WHEN** a signed-in user opens Home while published trips exist
- **THEN** the trips are listed and tapping one opens its thread with a visible back button
