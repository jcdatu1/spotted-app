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
The Profile tab SHALL present the signed-in user's identity-first profile per the brand design: avatar (placeholder until upload exists), display name, `@username`, bio, a stats row (followers, trips, saves), and the user's trips as boarding-pass cards. Followers and saves SHALL display 0 until those capabilities exist; the trips stat SHALL be the real count of the user's trips. Editing SHALL happen on a pushed Edit profile screen (with a visible back button) reached from an Edit profile button, persisting display name (1–50 chars) and bio through the typed data layer and reflecting changes without an app restart.

#### Scenario: View own profile
- **WHEN** a signed-in user opens the Profile tab
- **THEN** their avatar placeholder, display name, username, bio, stats row, and trip cards are displayed

#### Scenario: Stats default to zero
- **WHEN** a user with no trips opens their profile
- **THEN** followers, trips, and saves all display 0

#### Scenario: Edit display name
- **WHEN** the user opens Edit profile, changes their display name, and saves
- **THEN** they return to the profile with the new value persisted and shown immediately

#### Scenario: Edit screen is escapable
- **WHEN** the user opens Edit profile
- **THEN** a visible back button returns them to the profile without saving

### Requirement: Account holder can start a trip from their profile
The account-holder profile SHALL offer a New trip action in the trips section (and within the empty state when no trips exist) that opens the trip creation flow.

#### Scenario: Create from trips section
- **WHEN** the account holder taps the New trip action on their profile
- **THEN** the trip creation screen opens

#### Scenario: Empty state invites the first trip
- **WHEN** the account holder has no trips
- **THEN** the trips section shows an inviting empty state with a create action
