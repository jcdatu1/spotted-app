# user-profiles — delta spec

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Profile photo and cover photo are user-editable media
The Edit profile screen SHALL let the user pick a profile photo (square, avatar preset) and a cover photo (wide, cover preset), uploaded to the public `profile-media` bucket per the media-storage lifecycle (prepared client-side, unique filename, row patched, old file deleted). The profile row SHALL store `avatar_path` and `cover_path` (bucket-relative paths). New photos SHALL appear on the profile immediately after saving, and the header SHALL fall back to the teal band / initial placeholder when unset.

#### Scenario: Set a profile photo
- **WHEN** the user picks a photo for their avatar and saves
- **THEN** it uploads to their own prefix in profile-media, `avatar_path` updates, and the profile header shows the photo

#### Scenario: Replace a cover photo
- **WHEN** the user replaces an existing cover photo
- **THEN** the new image renders in the header band and the previous object is deleted from storage

#### Scenario: No media set
- **WHEN** a profile has no avatar or cover
- **THEN** the header renders the teal gradient band and the initial-in-circle placeholder

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
