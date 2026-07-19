# user-profiles — delta spec

## MODIFIED Requirements

### Requirement: Any user's profile is viewable read-only

The app SHALL provide a pushed audience profile screen (`/user/[id]`, visible chevron-only back button) showing another user's public identity — cover band (or teal fallback), avatar (or initial placeholder), display name, `@username`, bio — a stats row (followers = real follower count; saves 0 until that capability exists; trips = their published trip count), and their published trips as boarding-pass cards navigating into threads. The header's action slot SHALL present the Follow/Unfollow button per the follows capability. The screen SHALL offer no edit, sign-out, or create actions and SHALL NOT reveal drafts or private fields (e.g. birthday). When the viewed id is the signed-in user's own id, the route SHALL render the owner profile experience (per "User can view and edit their own profile") in place of the audience view, keeping the pushed back button.

#### Scenario: View another user's profile

- **WHEN** a signed-in user opens an audience profile from a search result
- **THEN** that user's header (with Follow or Unfollow action), real follower count, and published trips render, and tapping a trip opens its thread

#### Scenario: Drafts and private data stay hidden

- **WHEN** the viewed user has draft trips and a stored birthday
- **THEN** neither appears anywhere on the audience profile

#### Scenario: No owner actions offered

- **WHEN** any audience profile is displayed
- **THEN** no Edit profile, sign-out, or start-a-trip affordances are present

#### Scenario: Viewing yourself shows the owner experience

- **WHEN** a signed-in user opens `/user/[id]` with their own id (e.g. via search)
- **THEN** their owner profile renders (Edit profile, create CTA, drafts included), with no Follow button and a working back button to the previous screen

### Requirement: User can view and edit their own profile

The Profile tab SHALL present the signed-in user's identity-first profile per the brand design: cover photo in the header band when set (teal gradient band when not), avatar photo (initial-in-circle placeholder when not set), display name, `@username`, bio, a stats row (followers, trips, saves), and the user's trips as boarding-pass cards. Followers SHALL display the user's real follower count; saves SHALL display 0 until that capability exists; the trips stat SHALL be the real count of the user's trips. Editing SHALL happen on a pushed Edit profile screen (with a visible back button) reached from an Edit profile button, persisting cover photo, profile photo, display name (1–50 chars), bio (≤160 chars), and birthday through the typed data layer and reflecting changes without an app restart.

#### Scenario: View own profile

- **WHEN** a signed-in user opens the Profile tab
- **THEN** their cover (or teal band), avatar (or initial placeholder), display name, username, bio, stats row (real follower count), and trip cards are displayed

#### Scenario: Edit display name

- **WHEN** the user opens Edit profile, changes their display name, and saves
- **THEN** they return to the profile with the new value persisted and shown immediately

#### Scenario: Edit screen is escapable

- **WHEN** the user opens Edit profile
- **THEN** a visible back button returns them to the profile without saving
