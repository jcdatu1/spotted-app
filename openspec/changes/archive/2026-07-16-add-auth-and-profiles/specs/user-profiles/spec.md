# user-profiles — delta spec

## ADDED Requirements

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
The Profile tab SHALL display the signed-in user's username and display name through the typed data layer (`src/data/profiles.ts`), and SHALL allow editing the display name (and bio) with the change persisted and reflected without an app restart.

#### Scenario: View own profile
- **WHEN** a signed-in user opens the Profile tab
- **THEN** their username and display name are displayed

#### Scenario: Edit display name
- **WHEN** the user edits their display name and saves
- **THEN** the new value is persisted to the database and shown immediately
