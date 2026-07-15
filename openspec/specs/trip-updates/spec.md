# trip-updates Specification

## Purpose

The typed update stream at the heart of Spotted — a single table with per-type validation, chat-thread rendering ordered by happened_at, the owner-only composer, and private photo storage. The typed records are what make budgets and itinerary copying possible.

## Requirements

### Requirement: Updates are typed rows in a single table
Updates SHALL be stored in ONE `updates` table with a `type` enum (`note`, `photo`, `video` reserved, `purchase`, `attraction`) and typed nullable columns validated by per-type CHECK constraints: notes require `body`; photos require `media_path`; purchases require `amount`, `currency`, and `vendor_name`; attractions require `place_name` (entry fee optional). `amount` SHALL never exist without `currency`. The data layer SHALL expose updates as a TypeScript discriminated union.

#### Scenario: Malformed update rejected by the database
- **WHEN** an insert attempts a purchase update without an amount or currency
- **THEN** the database rejects it via CHECK constraint regardless of client validation

#### Scenario: Data layer narrows types
- **WHEN** a thread is fetched through `src/data/updates.ts`
- **THEN** each update is one of the union variants with its type-specific fields non-nullable

### Requirement: The thread renders updates in happened_at order
The trip thread SHALL render updates as chat-style bubble cards ordered by `happened_at` ascending, each styled per its type (note bubble; photo card; purchase card showing vendor, amount, currency; attraction card showing place and entry fee when present), using brand tokens (mono for money/dates).

#### Scenario: Read a thread
- **WHEN** a user opens a trip with updates of all four types
- **THEN** all updates render as their distinct card types in `happened_at` order

#### Scenario: Empty thread
- **WHEN** a trip with no updates is opened
- **THEN** an explicit empty state is shown (owner sees a prompt to post; readers see "no updates yet")

### Requirement: Owner posts updates from the in-thread composer
The trip thread SHALL show a composer to the trip owner only, offering the four types with type-specific forms and client-side validation mirroring the CHECK constraints. Posting SHALL append the update to the thread without leaving the screen.

#### Scenario: Post a note
- **WHEN** the owner submits a note with body text
- **THEN** the note appears in the thread and the input clears

#### Scenario: Post a purchase
- **WHEN** the owner submits a purchase with vendor, amount, and currency
- **THEN** the purchase card appears in the thread and the budget rollup reflects it

#### Scenario: Reader sees no composer
- **WHEN** a non-owner views a published trip
- **THEN** no composer is rendered

### Requirement: Photos are stored privately and rendered via signed URLs
Photo updates SHALL upload the image to the private `trip-media` bucket under an owner-prefixed path before the row is inserted; the thread SHALL resolve display URLs via batched signed URLs. Storage policies SHALL allow uploads only to the caller's own prefix and reads only to authenticated users.

#### Scenario: Post a photo
- **WHEN** the owner picks an image and submits a photo update
- **THEN** the image uploads to their prefix, the row references its path, and the photo renders in the thread

#### Scenario: Failed upload creates nothing
- **WHEN** the image upload fails
- **THEN** no update row is created and the composer shows an explicit error

### Requirement: Update writes are restricted to the trip owner
RLS SHALL allow inserting/updating/deleting updates only when the caller owns the parent trip and `author_id = auth.uid()`; updates SHALL be readable exactly when their parent trip is visible to the caller.

#### Scenario: Non-owner cannot post
- **WHEN** an authenticated user attempts to insert an update into a trip they do not own
- **THEN** the insert is rejected

#### Scenario: Draft updates hidden with their trip
- **WHEN** a non-owner queries updates belonging to another user's draft trip
- **THEN** zero rows are returned
