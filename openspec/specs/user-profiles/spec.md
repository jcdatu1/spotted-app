# user-profiles Specification

## Purpose

The profile record backing every user — auto-provisioning on sign-up, username rules, RLS ownership, and viewing/editing one's own profile. Everything downstream (trips, follows, reactions) references `profiles.id`.

## Requirements

### Requirement: Every user has exactly one auto-provisioned profile
The system SHALL create a `profiles` row automatically when an auth user is created, via a database trigger (security definer) reading username and display name from the sign-up metadata. Profile creation SHALL NOT depend on any client-side call after sign-up.

#### Scenario: Profile exists immediately after sign-up
- **WHEN** a user completes sign-up
- **THEN** a `profiles` row with their id, username, and display name exists before any client query runs

#### Scenario: Failed profile creation aborts sign-up
- **WHEN** the profile insert fails (e.g. duplicate username)
- **THEN** the auth user creation is rolled back and no orphaned user exists

### Requirement: Usernames are unique, constrained, and immutable
Usernames SHALL be unique, match `^[a-z0-9_]{3,20}$` (enforced by a database CHECK), and SHALL NOT be changeable after account creation in the MVP. Display names SHALL be editable, 1–50 characters.

#### Scenario: Invalid username rejected
- **WHEN** a sign-up is attempted with a username containing uppercase, spaces, or symbols outside `[a-z0-9_]`
- **THEN** the sign-up is rejected with a validation error

#### Scenario: Username change attempt blocked
- **WHEN** an update to a profile attempts to change the username
- **THEN** the database rejects the update

### Requirement: Profile access is enforced by RLS ownership
The `profiles` table SHALL enforce via RLS: SELECT for any authenticated user; UPDATE only where `auth.uid() = id`; no client INSERT or DELETE (insert is trigger-owned, delete cascades from auth user removal).

#### Scenario: Reading another user's profile
- **WHEN** an authenticated user queries another user's profile
- **THEN** the row is returned (profiles are readable app-wide)

#### Scenario: Updating another user's profile
- **WHEN** an authenticated user attempts to update a profile whose id is not their own
- **THEN** the update affects zero rows

### Requirement: User can view and edit their own profile
The Profile tab SHALL present the signed-in user's identity-first profile per the brand design: cover photo in the header band when set (teal gradient band when not), avatar photo (initial-in-circle placeholder when not set), display name, `@username`, bio, a stats row (followers, trips, saves), and the user's trips as boarding-pass cards. Followers and saves SHALL display 0 until those capabilities exist; the trips stat SHALL be the real count of the user's trips. Editing SHALL happen on a pushed Edit profile screen (with a visible back button) reached from an Edit profile button, persisting cover photo, profile photo, display name (1–50 chars), bio (≤160 chars), and birthday through the typed data layer and reflecting changes without an app restart.

#### Scenario: View own profile
- **WHEN** a signed-in user opens the Profile tab
- **THEN** their cover (or teal band), avatar (or initial placeholder), display name, username, bio, stats row, and trip cards are displayed

#### Scenario: Edit display name
- **WHEN** the user opens Edit profile, changes their display name, and saves
- **THEN** they return to the profile with the new value persisted and shown immediately

#### Scenario: Edit screen is escapable
- **WHEN** the user opens Edit profile
- **THEN** a visible back button returns them to the profile without saving

### Requirement: Profile photo and cover photo are user-editable media
The Edit profile screen SHALL let the user pick a profile photo (square, avatar preset) and a cover photo (wide, cover preset), uploaded to the public `profile-media` bucket per the media-storage lifecycle (prepared client-side, unique filename, row patched, old file deleted). Both pickers SHALL render as image input fields per the shared empty/filled pattern (dashed warm-gray empty state; image + scrim + `+` when set) with no auxiliary text labels such as "Change photo". The profile row SHALL store `avatar_path` and `cover_path` (bucket-relative paths). New photos SHALL appear on the profile immediately after saving; the profile *display* header SHALL keep its teal band / initial-in-circle fallback when media is unset.

#### Scenario: Set a profile photo
- **WHEN** the user picks a photo for their avatar and saves
- **THEN** it uploads to their own prefix in profile-media, `avatar_path` updates, and the profile header shows the photo

#### Scenario: Replace a cover photo
- **WHEN** the user replaces an existing cover photo
- **THEN** the new image renders in the header band and the previous object is deleted from storage

#### Scenario: Pickers follow the image-input pattern
- **WHEN** the Edit profile screen renders with no avatar or cover set
- **THEN** both pickers show the dashed warm-gray empty state with a centered `+`, and no "Change photo" / "Tap to add" text appears

#### Scenario: No media set on display surfaces
- **WHEN** a profile has no avatar or cover
- **THEN** the profile header renders the teal band and the initial-in-circle placeholder

### Requirement: Birthday is stored owner-private
Birthday SHALL be stored in a `private_profiles` table (one row per user, auto-provisioned at sign-up and backfilled for existing users) whose RLS grants SELECT and UPDATE only to the owning user, with no client INSERT or DELETE. The database SHALL reject birthdays that imply an age under 13 or predate 1900. Birthday SHALL NOT be readable by other users and SHALL NOT be displayed anywhere in the app in this change; the Edit profile screen SHALL accept it as a validated `YYYY-MM-DD` field.

#### Scenario: Owner sets their birthday
- **WHEN** the user enters a valid `YYYY-MM-DD` birthday (age ≥ 13) and saves
- **THEN** the value persists to their `private_profiles` row and pre-fills on the next edit

#### Scenario: Underage birthday rejected
- **WHEN** a birthday implying an age under 13 is submitted
- **THEN** validation rejects it and the database CHECK rejects it regardless of client state

#### Scenario: Another user cannot read a birthday
- **WHEN** any query from a different authenticated user touches `private_profiles`
- **THEN** zero rows are returned

### Requirement: Account holder can start a trip from their profile
The account-holder profile SHALL present a create-trip CTA card at the top of the trips section (matching the trip-card visual language and rendered height) that opens the trip creation flow; when no trips exist an empty-state card with a create action SHALL show instead. The create CTA SHALL be the profile's primary (coral) action; the Edit profile button SHALL use the secondary style.

#### Scenario: Create from trips section
- **WHEN** the account holder taps the CTA card at the top of their trips
- **THEN** the trip creation screen opens

#### Scenario: CTA matches card height
- **WHEN** the CTA card renders above trip cards
- **THEN** its height visually matches the trip cards below it

#### Scenario: Empty state invites the first trip
- **WHEN** the account holder has no trips
- **THEN** the trips section shows an inviting empty state with a create action
