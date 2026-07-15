# user-profiles — delta spec

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Account holder can start a trip from their profile
The account-holder profile SHALL offer a New trip action in the trips section (and within the empty state when no trips exist) that opens the trip creation flow.

#### Scenario: Create from trips section
- **WHEN** the account holder taps the New trip action on their profile
- **THEN** the trip creation screen opens

#### Scenario: Empty state invites the first trip
- **WHEN** the account holder has no trips
- **THEN** the trips section shows an inviting empty state with a create action
